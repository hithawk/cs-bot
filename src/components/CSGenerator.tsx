import { useState } from 'react';
import { Copy, Check, Loader2, Sparkles, Send } from 'lucide-react';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export default function CSGenerator() {
  const [sender, setSender] = useState('yoon');
  const [platform, setPlatform] = useState('naver');
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [sellerStance, setSellerStance] = useState('checking');
  const [customerComplaint, setCustomerComplaint] = useState('broken');
  const [inquiry, setInquiry] = useState('');
  const [customInstruction, setCustomInstruction] = useState('');
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const generateResponse = async () => {
    if (!inquiry.trim() || !apiKey) {
      setGeneratedResponse(apiKey ? "문의 내용을 입력해주세요." : "API 키가 설정되지 않았습니다. Vercel 환경변수를 확인하세요.");
      return;
    }
    setIsLoading(true);
    setGeneratedResponse('');

    try {
      const storeName = sender === 'yoon' ? '윤씨네 행복상회' : '맛능상회';
      const prompt = `당신은 온라인 쇼핑몰 [${storeName}]의 전문 CS 상담원입니다.
      [규칙]
      1. 인사 고정: "안녕하세요, 고객님. ${storeName}입니다."
      2. 고객 문의 내용 재언급 금지.
      3. 호칭: 오직 "고객님"만 사용.
      ${sellerStance === 'evidence_request' ? `4. 증빙자료 요청 필수 문구: "상품 수령 후 최대 48시간 이내에 아래 사진 3종을 첨부하여 문의(1:1 문의 혹은 1533-5710 문자)해 주시면 확인 즉시 책임지고 처리해 드리겠습니다.
      
      1. 제품의 운송장 사진: 송장 번호와 주소가 식별 가능해야 합니다.
      2. 전체 수량을 셀 수 있는 사진: 바둑판처럼 정렬하여 전체 개수가 한눈에 들어와야 합니다.
      3. 문제 상품 확인 사진: 문제 과수의 개수와 상태가 명확히 보이도록 여러 장 촬영 부탁드립니다."` : ''}
      [상황] 플랫폼:${platform}, 불만유형:${customerComplaint}, 판매자입장:${sellerStance}, 문의내용:"${inquiry}" ${customInstruction}`;

      // Gemini 2.0 Flash 호출을 위한 v1beta 경로 사용
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await res.json();
      
      if (data.error) {
        throw new Error(`${data.error.code}: ${data.error.message}`);
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setGeneratedResponse(text);
      } else {
        throw new Error("응답 데이터가 비어있습니다.");
      }
    } catch (e: any) {
      setGeneratedResponse(`에러 발생: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-4">
          <h1 className="text-xl font-bold">CS 답변 생성기 (Gemini 2.0)</h1>
          <div className="flex gap-2">
            <button onClick={() => setSender('yoon')} className={`flex-1 p-2 rounded-lg border transition-all ${sender === 'yoon' ? 'bg-stone-900 text-white' : 'bg-stone-100'}`}>윤태성[행복상회]</button>
            <button onClick={() => setSender('rachel')} className={`flex-1 p-2 rounded-lg border transition-all ${sender === 'rachel' ? 'bg-stone-900 text-white' : 'bg-stone-100'}`}>레이첼[맛능상회]</button>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500">판매자 입장 선택</label>
            <select value={sellerStance} onChange={e => setSellerStance(e.target.value)} className="w-full p-2 border rounded-lg bg-stone-50">
              <option value="checking">문제 확인 및 협의 중</option>
              <option value="evidence_request">증빙자료 요청 (사진 3종 가이드 포함)</option>
              <option value="partial_proposal">부분 환불 제안</option>
              <option value="full_refund_review">전액 환불 논의</option>
            </select>
          </div>
          <textarea value={inquiry} onChange={e => setInquiry(e.target.value)} placeholder="고객의 문의 내용을 여기에 붙여넣으세요." className="w-full h-40 p-3 border rounded-lg bg-stone-50 resize-none text-sm" />
          <button onClick={generateResponse} disabled={isLoading} className="w-full py-4 bg-stone-900 text-white rounded-xl flex justify-center items-center gap-2 hover:bg-stone-800 disabled:opacity-50">
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />} 
            <span>CS 답변 생성하기</span>
          </button>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col min-h-[450px]">
          <div className="flex justify-between items-center mb-4 border-bottom pb-2">
            <h2 className="font-bold flex items-center gap-2"><Send size={16} /> 생성된 답변</h2>
            {generatedResponse && (
              <button onClick={() => { navigator.clipboard.writeText(generatedResponse); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }} className="text-xs px-3 py-1 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors">
                {isCopied ? '복사완료!' : '결과 복사'}
              </button>
            )}
          </div>
          <div className="flex-1 bg-stone-50 p-5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">
            {generatedResponse || "위 양식을 채우고 생성 버튼을 눌러주세요."}
          </div>
        </div>
      </div>
    </div>
  );
}