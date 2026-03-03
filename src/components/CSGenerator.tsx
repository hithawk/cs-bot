import { useState } from 'react';
import { Copy, Check, Loader2, Sparkles, Send } from 'lucide-react';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export default function CSGenerator() {
  const [sender, setSender] = useState('yoon');
  const [platform, setPlatform] = useState('naver');
  const [productTypes, setProductTypes] = useState([]);
  const [sellerStance, setSellerStance] = useState('checking');
  const [customerComplaint, setCustomerComplaint] = useState('broken');
  const [inquiry, setInquiry] = useState('');
  const [customInstruction, setCustomInstruction] = useState('');
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const generateResponse = async () => {
    if (!inquiry.trim() || !apiKey) {
      setGeneratedResponse(apiKey ? "문의 내용을 입력하세요." : "Vercel 환경변수 설정(API 키)을 확인하세요.");
      return;
    }
    setIsLoading(true);
    setGeneratedResponse('');

    try {
      const storeName = sender === 'yoon' ? '윤씨네 행복상회' : '맛능상회';
      const prompt = `쇼핑몰 [${storeName}] CS 상담원입니다. 
      [규칙] 1.인사:"안녕하세요, 고객님. ${storeName}입니다." 고정. 2.문의재언급금지. 3.호칭:"고객님" 고정.
      ${sellerStance === 'evidence_request' ? `4.증빙 필수: "상품 수령 후 최대 48시간 이내에 아래 사진 3종을 첨부하여 문의(1:1 문의 혹은 1533-5710 문자)해 주시면 확인 즉시 처리해 드리겠습니다.
      1. 제품 운송장 사진: 송장 번호와 주소 식별 가능할 것.
      2. 전체 수량 사진: 바둑판 정렬하여 한눈에 보일 것.
      3. 문제 상품 사진: 상태가 명확히 보이도록 촬영 부탁드립니다."` : ''}
      [상황] 플랫폼:${platform}, 불만:${customerComplaint}, 입장:${sellerStance}, 문의:"${inquiry}" ${customInstruction}`;

      // v1 API 경로와 gemini-1.5-flash 모델 사용
      const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) setGeneratedResponse(text);
      else throw new Error("응답 없음");
    } catch (e) {
      setGeneratedResponse(`오류: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-4">
          <h1 className="text-xl font-bold">CS 답변 생성기</h1>
          <div className="flex gap-2">
            <button onClick={() => setSender('yoon')} className={`flex-1 p-2 rounded-lg border ${sender === 'yoon' ? 'bg-stone-900 text-white' : 'bg-stone-50'}`}>윤태성</button>
            <button onClick={() => setSender('rachel')} className={`flex-1 p-2 rounded-lg border ${sender === 'rachel' ? 'bg-stone-900 text-white' : 'bg-stone-50'}`}>레이첼</button>
          </div>
          <select value={sellerStance} onChange={e => setSellerStance(e.target.value)} className="w-full p-2 border rounded-lg bg-stone-50">
            <option value="checking">문제 확인 중</option>
            <option value="evidence_request">증빙자료 요청 (사진 3종)</option>
            <option value="partial_proposal">부분 환불 제안</option>
          </select>
          <textarea value={inquiry} onChange={e => setInquiry(e.target.value)} placeholder="고객 문의 내용" className="w-full h-32 p-3 border rounded-lg bg-stone-50 resize-none" />
          <button onClick={generateResponse} disabled={isLoading} className="w-full py-3 bg-blue-600 text-white rounded-lg flex justify-center items-center gap-2 hover:bg-blue-700 transition-colors">
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />} 답변 생성하기
          </button>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold">결과</h2>
            {generatedResponse && <button onClick={() => { navigator.clipboard.writeText(generatedResponse); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }} className="text-xs px-2 py-1 bg-stone-100 rounded">{isCopied ? '복사됨' : '복사'}</button>}
          </div>
          <div className="flex-1 bg-stone-50 p-4 rounded-xl text-sm whitespace-pre-wrap">{generatedResponse || "대기 중..."}</div>
        </div>
      </div>
    </div>
  );
}