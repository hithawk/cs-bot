import { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Copy, Check, Loader2, Sparkles, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Vite environment setup.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

type Sender = 'yoon' | 'rachel';
type Platform = 'toss' | 'alwayz' | 'kakao' | 'coupang' | 'naver';
type Status = 'checking_issue' | 'guiding_action' | 'refund_completed';
type ProductType = 'fresh' | 'industrial';
type CustomerComplaint = 'broken' | 'quality' | 'size_appearance' | 'delay' | 'refund_demand' | 'invalid_reason';
type SellerStance = 'checking' | 'evidence_request' | 'partial_proposal' | 'full_refund_review' | 'impossible';

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'toss', label: '토스 (Toss)' },
  { value: 'alwayz', label: '올웨이즈 (Alwayz)' },
  { value: 'kakao', label: '카카오 (Kakao)' },
  { value: 'coupang', label: '쿠팡 (Coupang)' },
  { value: 'naver', label: '네이버 (Naver)' },
];

const CUSTOMER_COMPLAINTS: { value: CustomerComplaint; label: string }[] = [
  { value: 'broken', label: '① 파손/터짐/썩음 (육안 확인 완료)' },
  { value: 'quality', label: '② 맛/품질 불만 (육안 확인 불가)' },
  { value: 'size_appearance', label: '③ 크기 및 외관 불만' },
  { value: 'delay', label: '④ 배송 지연 및 누락' },
  { value: 'refund_demand', label: '⑤ 전액 환불 강경 요구' },
  { value: 'invalid_reason', label: '⑥ 사유 미해당/반복적 반품 요청' },
];

const SELLER_STANCES: { value: SellerStance; label: string }[] = [
  { value: 'checking', label: '① 문제 확인 및 농가/공급사 협의 중' },
  { value: 'evidence_request', label: '② 증빙자료 요청 (48시간 이내 사진 3종)' },
  { value: 'partial_proposal', label: '③ 고객에게 조심스럽게 부분 환불 제안' },
  { value: 'full_refund_review', label: '④ 사진 증빙 검토 후 전액 환불 논의' },
  { value: 'impossible', label: '⑤ 규정상 환불 절대 불가 (정상과 판정)' },
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

  const handleProductTypeChange = (type: ProductType) => {
    setProductTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const generateResponse = async () => {
    if (!inquiry.trim()) return;
    if (!ai) {
      setGeneratedResponse("API 키가 설정되지 않았습니다. .env 파일의 VITE_GEMINI_API_KEY를 확인해주세요.");
      return;
    }

    setIsLoading(true);
    setGeneratedResponse('');

    try {
      const storeName = sender === 'yoon' ? '윤씨네 행복상회' : '맛능상회';
      const isFresh = productTypes.includes('fresh');
      const platformLabel = PLATFORMS.find(p => p.value === platform)?.label || platform;
      const complaintLabel = CUSTOMER_COMPLAINTS.find(c => c.value === customerComplaint)?.label || '';
      const stanceLabel = SELLER_STANCES.find(s => s.value === sellerStance)?.label || '';

      const prompt = `
        당신은 온라인 쇼핑몰 [${storeName}]의 전문 CS 상담원입니다. 
        객관적이고 정중한 비즈니스 톤으로 답변을 작성하세요.

        [기본 정보]
        - 쇼핑몰: ${storeName}
        - 플랫폼: ${platformLabel}
        - 고객 불만: ${complaintLabel}
        - 판매자 입장: ${stanceLabel}
        - 고객 문의 요지: "${inquiry}"

        [CS 필수 반영 규칙]
        1. **첫 인사 고정**: 반드시 "안녕하세요, 고객님. ${storeName}입니다."로 시작하세요.
        2. **고객 문의 재언급 금지**: 고객의 불만 내용을 그대로 복사해서 다시 말하지 마세요. 바로 상황 안내로 들어가세요.
        3. **호칭 주의**: 고객을 부를 때는 무조건 "고객님"이라고만 하세요. (절대 "레이첼 고객님" 금지)
        
        [판매자 입장별 필수 문구]
        ${sellerStance === 'evidence_request' ? `
        - 반드시 다음 내용을 포함하세요: "상품 수령 후 최대 48시간 이내에 아래 사진 3종을 첨부하여 문의(1:1 문의 혹은 1533-5710 문자)해 주시면 확인 즉시 책임지고 처리해 드리겠습니다.
        
        1. 제품의 운송장 사진: 송장 번호와 주소가 식별 가능해야 합니다.
        2. 전체 수량을 셀 수 있는 사진: 바둑판처럼 정렬하여 전체 개수가 한눈에 들어와야 합니다.
        3. 문제 상품 확인 사진: 문제 과수의 개수와 상태가 명확히 보이도록 여러 장 촬영 부탁드립니다."` : ''}

        ${sellerStance === 'partial_proposal' ? '- 보상(부분 환불)을 조심스럽게 제안하며 고객의 너른 양해를 구하는 내용을 작성하세요.' : ''}

        [플랫폼 및 상품별 추가 지침]
        ${isFresh ? '- 신선식품: 위생 및 오염 문제로 택배사 회수가 절대 불가하니 고객에게 정중히 "자체 폐기"를 요청하세요.' : ''}
        ${platform === 'toss' ? '- 토스 안내: 플랫폼 시스템상 답변 수정 불가 및 안심번호 만료 안내와 함께, 원활한 소통을 위해 추가 문의는 반드시 "새로운 문의글"로 남겨달라고 명시하세요.' : ''}
        
        ${customInstruction.trim() ? `- 판매자 개별 지시 사항(최우선 반영): "${customInstruction}"` : ''}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      setGeneratedResponse(response.text || "답변을 생성할 수 없습니다.");
    } catch (error) {
      console.error("Error:", error);
      setGeneratedResponse("오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedResponse) return;
    navigator.clipboard.writeText(generatedResponse);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans p-4 md:p-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">CS 답변 생성기</h1>
            <p className="text-stone-500">정확한 정보를 입력하여 답변을 생성하세요.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-6">
            {/* Sender */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-stone-700 uppercase">발신자 선택</label>
              <div className="flex gap-4">
                <label className={`flex-1 cursor-pointer relative p-4 rounded-xl border-2 transition-all ${sender === 'yoon' ? 'border-stone-900 bg-stone-50' : 'border-stone-100'}`}>
                  <input type="radio" checked={sender === 'yoon'} onChange={() => setSender('yoon')} className="sr-only" />
                  <div className="text-center font-bold">윤태성<div className="text-xs font-normal text-stone-500">[윤씨네 행복상회]</div></div>
                  {sender === 'yoon' && <div className="absolute top-2 right-2 text-stone-900"><Check size={16} /></div>}
                </label>
                <label className={`flex-1 cursor-pointer relative p-4 rounded-xl border-2 transition-all ${sender === 'rachel' ? 'border-stone-900 bg-stone-50' : 'border-stone-100'}`}>
                  <input type="radio" checked={sender === 'rachel'} onChange={() => setSender('rachel')} className="sr-only" />
                  <div className="text-center font-bold">레이첼<div className="text-xs font-normal text-stone-500">[맛능상회]</div></div>
                  {sender === 'rachel' && <div className="absolute top-2 right-2 text-stone-900"><Check size={16} /></div>}
                </label>
              </div>
            </div>

            {/* Platform & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700 uppercase">플랫폼</label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700 uppercase">현재 상태</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  <option value="checking_issue">문제 확인 중</option>
                  <option value="guiding_action">안내/조치 중</option>
                  <option value="refund_completed">환불 완료</option>
                </select>
              </div>
            </div>

            {/* Complaint & Stance */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700 uppercase">고객 불만 유형</label>
                <select value={customerComplaint} onChange={(e) => setCustomerComplaint(e.target.value as CustomerComplaint)} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  {CUSTOMER_COMPLAINTS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700 uppercase">판매자 입장</label>
                <select value={sellerStance} onChange={(e) =>