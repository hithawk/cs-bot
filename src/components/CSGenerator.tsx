import { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Copy, Check, Loader2, Sparkles, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

type Sender = 'yoon' | 'rachel';
type Platform = 'toss' | 'alwayz' | 'kakao' | 'coupang' | 'naver';
type Status = 'checking_issue' | 'guiding_action' | 'refund_completed';
type ProductType = 'fresh' | 'industrial';
type CustomerComplaint = 'broken' | 'quality' | 'size_appearance' | 'delay' | 'refund_demand' | 'invalid_reason';
type SellerStance = 'checking' | 'evidence_request' | 'partial_proposal' | 'full_refund_review' | 'impossible';

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'toss', label: '토스 (Toss)' }, { value: 'alwayz', label: '올웨이즈 (Alwayz)' },
  { value: 'kakao', label: '카카오 (Kakao)' }, { value: 'coupang', label: '쿠팡 (Coupang)' }, { value: 'naver', label: '네이버 (Naver)' },
];

const COMPLAINTS: { value: CustomerComplaint; label: string }[] = [
  { value: 'broken', label: '① 파손/터짐/썩음' }, { value: 'quality', label: '② 맛/품질 불만' },
  { value: 'size_appearance', label: '③ 크기 및 외관 불만' }, { value: 'delay', label: '④ 배송 지연 및 누락' },
  { value: 'refund_demand', label: '⑤ 전액 환불 강경 요구' }, { value: 'invalid_reason', label: '⑥ 사유 미해당' },
];

const STANCES: { value: SellerStance; label: string }[] = [
  { value: 'checking', label: '① 문제 확인/협의 중' }, { value: 'evidence_request', label: '② 증빙자료 요청 (사진 3종)' },
  { value: 'partial_proposal', label: '③ 부분 환불 제안' }, { value: 'full_refund_review', label: '④ 전액 환불 논의' },
  { value: 'impossible', label: '⑤ 환불 절대 불가' },
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
    if (!inquiry.trim() || !ai) return;
    setIsLoading(true);
    setGeneratedResponse('');
    try {
      const storeName = sender === 'yoon' ? '윤씨네 행복상회' : '맛능상회';
      const prompt = `당신은 전문 CS 상담원입니다. 
      [정보] 쇼핑몰:${storeName}, 플랫폼:${platform}, 불만:${customerComplaint}, 입장:${sellerStance}, 문의:"${inquiry}"
      [규칙] 1.인사:"안녕하세요, 고객님. ${storeName}입니다." 고정. 2.문의내용 재언급 금지. 3.호칭:"고객님" 고정.
      ${sellerStance === 'evidence_request' ? `4.증빙요청 필수문구: "상품 수령 후 최대 48시간 이내에 아래 사진 3종을 첨부하여 문의(1:1 문의 혹은 1533-5710 문자)해 주시면 확인 즉시 책임지고 처리해 드리겠습니다.
      1. 제품의 운송장 사진: 송장 번호와 주소가 식별 가능해야 합니다.
      2. 전체 수량을 셀 수 있는 사진: 바둑판처럼 정렬하여 전체 개수가 한눈에 들어와야 합니다.
      3. 문제 상품 확인 사진: 문제 과수의 개수와 상태가 명확히 보이도록 여러 장 촬영 부탁드립니다."` : ''}
      ${productTypes.includes('fresh') ? '5.신선식품:회수불가안내,자체폐기요청.' : ''}
      ${platform === 'toss' ? '6.토스:수정불가안내,새문의글요청.' : ''} ${customInstruction}`;

      const res = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: [{ role: "user", parts: [{ text: prompt }] }] });
      setGeneratedResponse(res.response.text() || "오류");
    } catch (e) { setGeneratedResponse("에러 발생"); } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <h1 className="text-2xl font-bold">CS 답변 생성기</h1>
          <div className="flex gap-4">
            <button onClick={() => setSender('yoon')} className={`flex-1 p-3 rounded-xl border-2 ${sender === 'yoon' ? 'border-stone-900 bg-stone-50' : 'border-stone-100'}`}>윤태성[행복상회]</button>
            <button onClick={() => setSender('rachel')} className={`flex-1 p-3 rounded-xl border-2 ${sender === 'rachel' ? 'border-stone-900 bg-stone-50' : 'border-stone-100'}`}>레이첼[맛능상회]</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select value={platform} onChange={e => setPlatform(e.target.value as Platform)} className="p-3 bg-stone-50 border rounded-xl">{PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select>
            <select value={status} onChange={e => setStatus(e.target.value as Status)} className="p-3 bg-stone-50 border rounded-xl"><option value="checking_issue">문제 확인 중</option><option value="guiding_action">안내 중</option><option value="refund_completed">환불 완료</option></select>
          </div>
          <select value={customerComplaint} onChange={e => setCustomerComplaint(e.target.value as CustomerComplaint)} className="w-full p-3 bg-stone-50 border rounded-xl">{COMPLAINTS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
          <select value={sellerStance} onChange={e => setSellerStance(e.target.value as SellerStance)} className="w-full p-3 bg-stone-50 border rounded-xl">{STANCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
          <div className="flex gap-4">
            <label className="flex items-center gap-2"><input type="checkbox" onChange={() => setProductTypes(prev => prev.includes('fresh') ? prev.filter(t => t !== 'fresh') : [...prev, 'fresh'])} />신선식품</label>
            <label className="flex items-center gap-2"><input type="checkbox" onChange={() => setProductTypes(prev => prev.includes('industrial') ? prev.filter(t => t !== 'industrial') : [...prev, 'industrial'])} />공산품</label>
          </div>
          <textarea value={inquiry} onChange={e => setInquiry(e.target.value)} placeholder="문의 내용" className="w-full h-24 p-4 bg-stone-50 border rounded-xl resize-none" />
          <textarea value={customInstruction} onChange={e => setCustomInstruction(e.target.value)} placeholder="추가 지시" className="w-full h-20 p-4 bg-stone-50 border rounded-xl resize-none" />
          <button onClick={generateResponse} disabled={isLoading || !inquiry.trim()} className="w-full py-4 bg-stone-900 text-white rounded-xl flex justify-center gap-2">
            {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />} 답변 생성
          </button>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col min-h-[400px]">
          <div className="flex justify-between mb-4"><h2 className="font-bold flex items-center gap-2"><Send size={18} /> 생성 결과</h2>
          {generatedResponse && <button onClick={() => { navigator.clipboard.writeText(generatedResponse); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }} className="text-xs px-3 py-1 bg-stone-100 rounded-full">{isCopied ? '복사됨' : '복사'}</button>}</div>
          <div className="flex-1 bg-stone-50 rounded-xl p-6 whitespace-pre-wrap text-sm leading-relaxed">{generatedResponse || "내용을 입력해주세요."}</div>
        </div>
      </div>
    </div>
  );
}