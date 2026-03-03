import { useState } from 'react';
import { Copy, Check, Loader2, Sparkles, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

type Sender = 'yoon' | 'rachel';
type Platform = 'toss' | 'alwayz' | 'kakao' | 'coupang' | 'naver';
type ProductType = 'fresh' | 'industrial';
type CustomerComplaint = 'broken' | 'quality' | 'size_appearance' | 'delay' | 'refund_demand' | 'invalid_reason';
type SellerStance = 'checking' | 'evidence_request' | 'partial_proposal' | 'full_refund_review' | 'impossible';

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'toss', label: '토스 (Toss)' }, { value: 'alwayz', label: '올웨이즈 (Alwayz)' },
  { value: 'kakao', label: '카카오 (Kakao)' }, { value: 'coupang', label: '쿠팡 (Coupang)' }, { value: 'naver', label: '네이버 (Naver)' },
];

const CUSTOMER_COMPLAINTS: { value: CustomerComplaint; label: string }[] = [
  { value: 'broken', label: '① 파손/터짐/썩음' },
  { value: 'quality', label: '② 맛/품질 불만' },
  { value: 'size_appearance', label: '③ 크기 및 외관 불만' },
  { value: 'delay', label: '④ 배송 지연 및 누락' },
  { value: 'refund_demand', label: '⑤ 전액 환불 강경 요구' },
  { value: 'invalid_reason', label: '⑥ 사유 미해당/반복 반품' },
];

const SELLER_STANCES: { value: SellerStance; label: string }[] = [
  { value: 'checking', label: '① 문제 확인 및 협의 중' },
  { value: 'evidence_request', label: '② 자료 미흡 - 사진 증빙 요청 (48시간)' },
  { value: 'partial_proposal', label: '③ 자료 확인 완료 - 부분 환불 제안' },
  { value: 'full_refund_review', label: '④ 자료 확인 완료 - 전액 환불 안내' },
  { value: 'impossible', label: '⑤ 규정상 환불 불가 안내' },
];

export default function CSGenerator() {
  const [sender, setSender] = useState<Sender>('yoon');
  const [platform, setPlatform] = useState<Platform>('naver');
  const [productType, setProductType] = useState<ProductType>('fresh');
  const [customerComplaint, setCustomerComplaint] = useState<CustomerComplaint>('broken');
  const [sellerStance, setSellerStance] = useState<SellerStance>('checking');
  const [inquiry, setInquiry] = useState('');
  const [customInstruction, setCustomInstruction] = useState('');
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const generateResponse = async () => {
    if (!inquiry.trim() || !apiKey) return;
    setIsLoading(true);
    setGeneratedResponse('');

    try {
      const storeName = sender === 'yoon' ? '윤씨네 행복상회' : '맛능상회';
      const isFresh = productType === 'fresh';
      const complaintLabel = CUSTOMER_COMPLAINTS.find(c => c.value === customerComplaint)?.label || '';
      const stanceLabel = SELLER_STANCES.find(s => s.value === sellerStance)?.label || '';

      const prompt = `
        당신은 온라인 쇼핑몰 [${storeName}]의 전문 CS 상담원입니다.
        [정보] 플랫폼:${platform}, 상품:${isFresh ? '신선식품' : '공산품'}, 불만:${complaintLabel}, 입장:${stanceLabel}, 문의:"${inquiry}"
        
        [필수 규칙]
        1. 첫 문장 고정: "안녕하세요, 고객님. ${storeName}입니다."
        2. 문의 내용 재언급 금지. 호칭은 "고객님" 통일.
        3. 정중하고 간결한 비즈니스 톤.

        [상황별 로직]
        - ${sellerStance === 'evidence_request' ? `증빙 요청: 사진 3종(운송장, 전체수량, 문제상품)을 48시간 이내 요청.` : `사진 확인 완료: 추가 사진 요청 절대 금지.`}
        - ${sellerStance === 'partial_proposal' ? `사진 확인 완료 언급 후, 부분 환불 제안 및 동의 시 계좌번호 요청.` : ''}
        - ${isFresh ? `신선식품 규칙: 위생 문제로 택배사 회수 불가 안내 및 '자체 폐기' 요청.` : `공산품 규칙: 반품 필요 시 택배사 회수 절차 안내.`}
        - ${platform === 'toss' ? `토스 규칙: 답변 수정 불가 안내 및 추가 문의 시 '새로운 문의글' 작성 요청.` : ''}
        - 지시 반영: ${customInstruction}
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();
      setGeneratedResponse(data.candidates?.[0]?.content?.parts?.[0]?.text || "생성 실패");
    } catch (e) {
      setGeneratedResponse("통신 에러가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-8 flex justify-center">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-5">
            <h1 className="text-2xl font-bold">CS 답변 생성기</h1>
            
            <div className="flex gap-2">
              <button onClick={() => setSender('yoon')} className={`flex-1 p-3 rounded-xl border transition-all ${sender === 'yoon' ? 'bg-stone-900 text-white font-bold' : 'bg-stone-50'}`}>윤태성[행복상회]</button>
              <button onClick={() => setSender('rachel')} className={`flex-1 p-3 rounded-xl border transition-all ${sender === 'rachel' ? 'bg-stone-900 text-white font-bold' : 'bg-stone-50'}`}>레이첼[맛능상회]</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">플랫폼</label>
                <select value={platform} onChange={e => setPlatform(e.target.value as Platform)} className="w-full p-2.5 border rounded-lg bg-stone-50 text-sm">{PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">상품 종류</label>
                <div className="flex gap-1 h-[42px]">
                  <button onClick={() => setProductType('fresh')} className={`flex-1 text-xs rounded-lg border ${productType === 'fresh' ? 'bg-green-50 border-green-200 text-green-700 font-bold' : 'bg-stone-50'}`}>신선</button>
                  <button onClick={() => setProductType('industrial')} className={`flex-1 text-xs rounded-lg border ${productType === 'industrial' ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'bg-stone-50'}`}>공산품</button>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">고객 불만 유형</label>
              <select value={customerComplaint} onChange={e => setCustomerComplaint(e.target.value as CustomerComplaint)} className="w-full p-3 border rounded-xl bg-stone-50 text-sm font-medium">
                {CUSTOMER_COMPLAINTS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">처리 프로세스 (판매자 입장)</label>
              <select value={sellerStance} onChange={e => setSellerStance(e.target.value as SellerStance)} className="w-full p-3 border rounded-xl bg-blue-50 text-blue-700 text-sm font-bold">
                {SELLER_STANCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <textarea value={inquiry} onChange={e => setInquiry(e.target.value)} placeholder="고객 문의 내용을 입력하세요" className="w-full h-32 p-4 border rounded-xl resize-none text-sm outline-none focus:ring-1 focus:ring-stone-900" />
            <textarea value={customInstruction} onChange={e => setCustomInstruction(e.target.value)} placeholder="AI 추가 지시 사항 (예: 50% 보상 제안)" className="w-full h-16 p-3 border rounded-xl resize-none text-xs bg-stone-50/50" />

            <button onClick={generateResponse} disabled={isLoading} className="w-full py-4 bg-stone-900 text-white rounded-xl flex justify-center items-center gap-2 hover:bg-stone-800 disabled:opacity-50">
              {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
              <span className="font-bold">CS 답변 생성</span>
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex-1 flex flex-col min-h-[600px]">
            <div className="flex justify-between items-center mb-4 border-b pb-4">
              <h2 className="font-bold flex items-center gap-2"><Send size={18} /> 생성된 답변 결과</h2>
              {generatedResponse && (
                <button onClick={() => { navigator.clipboard.writeText(generatedResponse); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }} className="text-xs font-bold px-4 py-2 bg-stone-900 text-white rounded-full">
                  {isCopied ? '복사 완료' : '답변 전체 복사'}
                </button>
              )}
            </div>
            <div className="flex-1 bg-stone-50 p-6 rounded-xl whitespace-pre-wrap text-[15px] leading-relaxed text-stone-800">
              {generatedResponse || "양식을 채운 뒤 생성 버튼을 눌러주세요."}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}