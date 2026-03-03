import { useState } from 'react';
import { Copy, Check, Loader2, Sparkles, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

type Sender = 'yoon' | 'rachel';
type Platform = 'toss' | 'alwayz' | 'kakao' | 'coupang' | 'naver';
type Status = 'checking_issue' | 'guiding_refund' | 'refund_completed';
type ProductType = 'fresh' | 'industrial';
type CustomerComplaint = 'broken' | 'quality' | 'size_appearance' | 'delay' | 'refund_demand' | 'invalid_reason';
// 판매자 입장 세분화 (증빙 요청과 환불 제안 분리)
type SellerStance = 'checking' | 'evidence_request' | 'partial_proposal' | 'full_refund_review' | 'impossible';

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'toss', label: '토스 (Toss)' },
  { value: 'alwayz', label: '올웨이즈 (Alwayz)' },
  { value: 'kakao', label: '카카오 (Kakao)' },
  { value: 'coupang', label: '쿠팡 (Coupang)' },
  { value: 'naver', label: '네이버 (Naver)' },
];

const CUSTOMER_COMPLAINTS: { value: CustomerComplaint; label: string }[] = [
  { value: 'broken', label: '① 파손/터짐/썩음' },
  { value: 'quality', label: '② 맛/품질 불만' },
  { value: 'size_appearance', label: '③ 크기 및 외관 불만' },
  { value: 'delay', label: '④ 배송 지연 및 누락' },
  { value: 'refund_demand', label: '⑤ 전액 환불 강경 요구' },
];

// 수정된 판매자 입장 목록
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
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [status, setStatus] = useState<Status>('checking_issue');
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
      const isFresh = productTypes.includes('fresh');
      const stanceLabel = SELLER_STANCES.find(s => s.value === sellerStance)?.label || '';

      const prompt = `
        당신은 온라인 쇼핑몰 [${storeName}]의 전문 CS 상담원입니다.
        [조건] 플랫폼:${platform}, 입장:${stanceLabel}, 문의:"${inquiry}"
        
        [필수 규칙]
        1. 첫 문장 고정: "안녕하세요, 고객님. ${storeName}입니다."
        2. 고객 문의 내용 재언급 금지 (앵무새 답변 금지).
        3. 호칭은 "고객님"으로 통일.
        4. 미사여구 배제, 정중하고 간결한 비즈니스 톤.

        [상황별 로직]
        - ${sellerStance === 'evidence_request' ? `자료가 부족한 상황입니다. 사진 증빙 3종(1.운송장, 2.전체수량/바둑판정렬, 3.문제상품상세)을 48시간 이내에 보내달라고 요청하세요.` : `이미 자료를 확인한 상황입니다. 추가 사진 요청은 절대 하지 마세요.`}
        - ${sellerStance === 'partial_proposal' ? `보내주신 사진을 확인했습니다. 부분 환불(농가 협의안보다 상향 조정됨을 강조 가능)을 제안하고 동의 시 계좌번호를 남겨달라고 안내하세요.` : ''}
        - ${isFresh ? `신선식품 규칙: 위생 문제로 택배사 회수 불가하므로 사진 확인 후 '자체 폐기' 요청을 포함하세요.` : ''}
        - ${platform === 'toss' ? `토스 규칙: 답변 수정 불가하므로 추가 문의 시 '새로운 문의글' 작성이 필요함을 안내하세요.` : ''}
        - 지시사항 반영: ${customInstruction}
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
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <h1 className="text-2xl font-bold">CS 답변 생성기</h1>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-4">
            <div className="flex gap-2">
              <button onClick={() => setSender('yoon')} className={`flex-1 p-3 rounded-xl border ${sender === 'yoon' ? 'bg-stone-900 text-white font-bold' : 'bg-stone-50'}`}>윤태성[행복상회]</button>
              <button onClick={() => setSender('rachel')} className={`flex-1 p-3 rounded-xl border ${sender === 'rachel' ? 'bg-stone-900 text-white font-bold' : 'bg-stone-50'}`}>레이첼[맛능상회]</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={platform} onChange={e => setPlatform(e.target.value as Platform)} className="p-2 border rounded-lg bg-stone-50 text-sm">{PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select>
              <div className="flex items-center gap-2 px-2 border rounded-lg bg-stone-50">
                <input type="checkbox" checked={productTypes.includes('fresh')} onChange={() => setProductTypes(prev => prev.includes('fresh') ? [] : ['fresh'])} id="fresh" /><label htmlFor="fresh" className="text-sm cursor-pointer">신선식품(회수불가)</label>
              </div>
            </div>
            <select value={sellerStance} onChange={e => setSellerStance(e.target.value as SellerStance)} className="w-full p-3 border rounded-xl bg-stone-50 font-medium text-blue-700">{SELLER_STANCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
            <textarea value={inquiry} onChange={e => setInquiry(e.target.value)} placeholder="고객 문의 내용" className="w-full h-32 p-4 border rounded-xl resize-none text-sm" />
            <textarea value={customInstruction} onChange={e => setCustomInstruction(e.target.value)} placeholder="추가 지시 (예: 50% 환불 제안해줘)" className="w-full h-20 p-4 border rounded-xl resize-none text-sm bg-blue-50/30" />
            <button onClick={generateResponse} disabled={isLoading} className="w-full py-4 bg-stone-900 text-white rounded-xl flex justify-center items-center gap-2 hover:bg-stone-800 disabled:opacity-50">
              {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />} 답변 생성하기
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex-1 flex flex-col min-h-[500px]">
            <div className="flex justify-between mb-4"><h2 className="font-bold flex items-center gap-2"><Send size={18} /> 결과창</h2>
            {generatedResponse && <button onClick={() => { navigator.clipboard.writeText(generatedResponse); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }} className="text-xs px-3 py-1 bg-stone-100 rounded-full">{isCopied ? '복사됨' : '복사'}</button>}</div>
            <div className="flex-1 bg-stone-50 p-6 rounded-xl whitespace-pre-wrap text-sm leading-relaxed">{generatedResponse || "양식을 채운 뒤 생성을 눌러주세요."}</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}