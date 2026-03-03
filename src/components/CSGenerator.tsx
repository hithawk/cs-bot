import { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Copy, Check, Loader2, Sparkles, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Vite environment setup.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

type Sender = 'yoon' | 'rachel';
type Platform = 'toss' | 'alwayz' | 'kakao' | 'coupang' | 'naver';
type Status = 'refunded' | 'negotiating';
type ProductType = 'fresh' | 'industrial';
type CustomerComplaint = 'broken' | 'quality' | 'delay' | 'refund_demand' | 'invalid_reason';
type SellerStance = 'checking' | 'pressure' | 'impossible' | 'partial_negotiation' | 'partial_proposal';

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'toss', label: '토스 (Toss)' },
  { value: 'alwayz', label: '올웨이즈 (Alwayz)' },
  { value: 'kakao', label: '카카오 (Kakao)' },
  { value: 'coupang', label: '쿠팡 (Coupang)' },
  { value: 'naver', label: '네이버 (Naver)' },
];

const CUSTOMER_COMPLAINTS: { value: CustomerComplaint; label: string }[] = [
  { value: 'broken', label: '① 파손/터짐/썩음 (육안 확인 완료)' },
  { value: 'quality', label: '② 품질 불만 (육안 확인 불가/주관적 판단)' },
  { value: 'delay', label: '③ 배송 지연 및 누락' },
  { value: 'refund_demand', label: '④ 전액 환불 강경 요구' },
  { value: 'invalid_reason', label: '⑤ 사유 미해당 및 반복적인 반품 요청' },
];

const SELLER_STANCES: { value: SellerStance; label: string }[] = [
  { value: 'checking', label: '① 농가/공급사 최종 확인 및 협의 중' },
  { value: 'pressure', label: '② 사진 증빙 토대로 전액 환불 압박 중' },
  { value: 'impossible', label: '③ 규정상 환불 절대 불가 (정상과 판정)' },
  { value: 'partial_negotiation', label: '④ 농가/공급사와 부분 보상 협의 중' },
  { value: 'partial_proposal', label: '⑤ 고객에게 직접 부분 환불 제안 예정' },
];

export default function CSGenerator() {
  const [sender, setSender] = useState<Sender>('yoon');
  const [platform, setPlatform] = useState<Platform>('naver');
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [status, setStatus] = useState<Status>('negotiating');
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
      const senderName = sender === 'yoon' ? '윤태성' : '레이첼';
      
      const isFresh = productTypes.includes('fresh');
      const productTypeLabels = productTypes.map(t => t === 'fresh' ? '신선식품' : '공산품').join(', ');
      const statusLabel = status === 'refunded' ? '환불완료' : '협의중';
      const platformLabel = PLATFORMS.find(p => p.value === platform)?.label || platform;
      const complaintLabel = CUSTOMER_COMPLAINTS.find(c => c.value === customerComplaint)?.label || '';
      const stanceLabel = SELLER_STANCES.find(s => s.value === sellerStance)?.label || '';

      const prompt = `
        당신은 온라인 쇼핑몰의 전문적인 CS 상담원입니다. 미사여구를 배제하고 객관적이고 전문적인 비즈니스 톤으로 답변을 작성하세요.

        [기본 정보]
        - 발신자: ${senderName}
        - 쇼핑몰 이름: ${storeName}
        - 플랫폼: ${platformLabel}
        - 상품 종류: ${productTypeLabels || '지정되지 않음'}
        - 현재 처리 상태: ${statusLabel}
        - 고객 불만 유형: ${complaintLabel}
        - 판매자 입장: ${stanceLabel}
        - 고객 문의 내용: "${inquiry}"
        ${customInstruction.trim() ? `- 판매자 개별 지시 사항: "${customInstruction}"` : ''}

        [CS 필수 반영 규칙]
        1. 답변의 시작은 반드시 "[${storeName}]"으로 하세요.
        ${isFresh ? '2. 신선식품 클레임: 위생 및 오염 문제로 인해 택배사 회수가 불가하므로, 고객이 상품을 자체 폐기해야 한다는 안내를 반드시 포함하세요.' : ''}
        ${platform === 'toss' ? '3. 토스 쇼핑 안내: 플랫폼 시스템상 답변 등록 후 수정이 불가하며, 안심번호 만료 시 고객과 소통이 단절될 수 있으므로, 원활한 소통을 위해 추가 문의 사항은 반드시 새로운 문의글로 작성해 달라는 안내를 포함하세요.' : ''}
        4. 판매자 개별 지시 사항 적용: 개별 지시 사항이 입력된 경우, 기존의 기본 안내(환불 불가 등)보다 최우선으로 적용하여 전체 문맥을 자연스럽게 재작성하세요.
        5. 상태별 대응: 
           - '환불완료' 상태일 경우 사진 증빙 등 추가 요구를 제외하고 환불 완료 사실만 안내하세요.
           ${sellerStance === 'impossible' ? '- 환불 불가 입장일 경우, 신선식품 특성상 주관적 판단(맛, 모양 등)으로 인한 환불은 불가함을 안내하세요.' : ''}
           ${(sellerStance === 'checking' || sellerStance === 'partial_negotiation') ? '- 농가/공급사와 협의 중이므로 잠시 기다려 달라는 안내를 포함하세요.' : ''}
        6. 고객 응대 매너 (핵심): 고객의 감정이 상하지 않도록 고객 문의 내용을 그대로 복사하여 재언급하는 것을 절대 금지합니다.
        7. 호칭: "레이첼 고객님"처럼 발신자 이름(레이첼)을 고객에게 지칭하는 오류를 절대 범하지 마세요. 답변 서두에 발신자를 밝힐 때만 사용하고, 고객을 부를 때는 "고객님"이라고만 명시하세요.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      setGeneratedResponse(response.text || "답변을 생성할 수 없습니다.");
    } catch (error) {
      console.error("Error generating response:", error);
      setGeneratedResponse("오류가 발생했습니다. 개발자 도구의 콘솔 창을 확인해주세요.");
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
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-stone-900">CS 답변 생성기</h1>
            <p className="text-stone-500">고객 문의에 대한 전문적인 답변을 자동으로 생성합니다.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-6">
            
            {/* Sender Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-stone-700 uppercase tracking-wider">발신자 선택</label>
              <div className="flex gap-4">
                <label className={`flex-1 cursor-pointer relative p-4 rounded-xl border-2 transition-all ${sender === 'yoon' ? 'border-stone-900 bg-stone-50' : 'border-stone-100 hover:border-stone-300'}`}>
                  <input type="radio" name="sender" value="yoon" checked={sender === 'yoon'} onChange={() => setSender('yoon')} className="sr-only" />
                  <div className="text-center">
                    <div className="font-bold">윤태성</div>
                    <div className="text-xs text-stone-500">[윤씨네 행복상회]</div>
                  </div>
                  {sender === 'yoon' && <div className="absolute top-2 right-2 text-stone-900"><Check size={16} /></div>}
                </label>
                <label className={`flex-1 cursor-pointer relative p-4 rounded-xl border-2 transition-all ${sender === 'rachel' ? 'border-stone-900 bg-stone-50' : 'border-stone-100 hover:border-stone-300'}`}>
                  <input type="radio" name="sender" value="rachel" checked={sender === 'rachel'} onChange={() => setSender('rachel')} className="sr-only" />
                  <div className="text-center">
                    <div className="font-bold">레이첼</div>
                    <div className="text-xs text-stone-500">[맛능상회]</div>
                  </div>
                  {sender === 'rachel' && <div className="absolute top-2 right-2 text-stone-900"><Check size={16} /></div>}
                </label>
              </div>
            </div>

            {/* Platform & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700 uppercase tracking-wider">플랫폼</label>
                <div className="relative">
                  <select 
                    value={platform} 
                    onChange={(e) => setPlatform(e.target.value as Platform)}
                    className="w-full appearance-none bg-stone-50 border border-stone-200 text-stone-900 text-sm rounded-xl focus:ring-stone-500 focus:border-stone-500 block p-3 pr-8"
                  >
                    {PLATFORMS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700 uppercase tracking-wider">현재 상태</label>
                <div className="relative">
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value as Status)}
                    className="w-full appearance-none bg-stone-50 border border-stone-200 text-stone-900 text-sm rounded-xl focus:ring-stone-500 focus:border-stone-500 block p-3 pr-8"
                  >
                    <option value="negotiating">협의중</option>
                    <option value="refunded">환불완료</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Complaint & Seller Stance */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700 uppercase tracking-wider">고객 불만 유형</label>
                <div className="relative">
                  <select 
                    value={customerComplaint} 
                    onChange={(e) => setCustomerComplaint(e.target.value as CustomerComplaint)}
                    className="w-full appearance-none bg-stone-50 border border-stone-200 text-stone-900 text-sm rounded-xl focus:ring-stone-500 focus:border-stone-500 block p-3 pr-8"
                  >
                    {CUSTOMER_COMPLAINTS.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700 uppercase tracking-wider">판매자 입장</label>
                <div className="relative">
                  <select 
                    value={sellerStance} 
                    onChange={(e) => setSellerStance(e.target.value as SellerStance)}
                    className="w-full appearance-none bg-stone-50 border border-stone-200 text-stone-900 text-sm rounded-xl focus:ring-stone-500 focus:border-stone-500 block p-3 pr-8"
                  >
                    {SELLER_STANCES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Type */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-stone-700 uppercase tracking-wider">상품 종류</label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${productTypes.includes('fresh') ? 'bg-stone-900 border-stone-900' : 'border-stone-300'}`}>
                    {productTypes.includes('fresh') && <Check size={12} className="text-white" />}
                  </div>
                  <input type="checkbox" checked={productTypes.includes('fresh')} onChange={() => handleProductTypeChange('fresh')} className="hidden" />
                  <span className="text-stone-700">신선식품</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${productTypes.includes('industrial') ? 'bg-stone-900 border-stone-900' : 'border-stone-300'}`}>
                    {productTypes.includes('industrial') && <Check size={12} className="text-white" />}
                  </div>
                  <input type="checkbox" checked={productTypes.includes('industrial')} onChange={() => handleProductTypeChange('industrial')} className="hidden" />
                  <span className="text-stone-700">공산품</span>
                </label>
              </div>
            </div>

            {/* Inquiry Text Area */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700 uppercase tracking-wider">고객 문의 내용</label>
              <textarea 
                value={inquiry}
                onChange={(e) => setInquiry(e.target.value)}
                placeholder="고객의 문의 내용을 입력하세요..."
                className="w-full h-32 p-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent resize-none transition-all"
              />
            </div>

            {/* Custom Instruction Text Area */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700 uppercase tracking-wider">판매자 개별 지시 사항 (선택)</label>
              <textarea 
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="예: 이번만 특별히 환불해준다고 안내해줘, 사진 다시 찍어달라고 해..."
                className="w-full h-24 p-4 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent resize-none transition-all"
              />
            </div>

            <button
              onClick={generateResponse}
              disabled={isLoading || !inquiry.trim()}
              className="w-full py-4 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-stone-900/10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>답변 생성 중...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>답변 생성하기</span>
                </>
              )}
            </button>

          </div>
        </motion.div>

        {/* Output Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col h-full"
        >
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 h-full flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Send size={18} />
                <span>생성된 답변</span>
              </h2>
              {generatedResponse && (
                <button 
                  onClick={copyToClipboard}
                  className="text-xs font-medium px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center gap-1.5 transition-colors"
                >
                  {isCopied ? <Check size={14} /> : <Copy size={14} />}
                  {isCopied ? '복사됨' : '복사하기'}
                </button>
              )}
            </div>

            <div className="flex-1 bg-stone-50 rounded-xl p-6 overflow-y-auto border border-stone-100 relative">
              {generatedResponse ? (
                <div className="whitespace-pre-wrap text-stone-800 leading-relaxed text-sm md:text-base">
                  {generatedResponse}
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 p-8 text-center">
                  <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                    <Sparkles size={24} className="text-stone-300" />
                  </div>
                  <p>왼쪽 양식을 작성하고<br/>'답변 생성하기'를 눌러주세요.</p>
                </div>
              )}
            </div>
            
            {/* Decorative bottom bar */}
            <div className="h-1 w-full bg-gradient-to-r from-stone-200 via-stone-400 to-stone-200 mt-4 rounded-full opacity-50"></div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}