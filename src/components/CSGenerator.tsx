import { useState, ChangeEvent } from 'react';
import { Copy, Check, Loader2, Sparkles, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;

type Sender = 'yoon' | 'rachel';
type Platform = 'toss' | 'alwayz' | 'kakao' | 'coupang' | 'naver';
type ProductType = 'fresh' | 'industrial';
type CustomerComplaint = 'none' | 'broken' | 'quality' | 'size_appearance' | 'delay' | 'refund_demand' | 'invalid_reason';
type SellerStance = 'none' | 'checking' | 'evidence_request' | 'partial_proposal' | 'full_refund_review' | 'impossible';

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'toss', label: '토스 (Toss)' }, { value: 'alwayz', label: '올웨이즈 (Alwayz)' },
  { value: 'kakao', label: '카카오 (Kakao)' }, { value: 'coupang', label: '쿠팡 (Coupang)' }, { value: 'naver', label: '네이버 (Naver)' },
];

const CUSTOMER_COMPLAINTS: { value: CustomerComplaint; label: string }[] = [
  { value: 'none', label: '선택 안 함 (기타/일반 문의)' },
  { value: 'broken', label: '① 파손/터짐/썩음' },
  { value: 'quality', label: '② 맛/품질 불만' },
  { value: 'size_appearance', label: '③ 크기 및 외관 불만' },
  { value: 'delay', label: '④ 배송 지연 및 누락' },
  { value: 'refund_demand', label: '⑤ 전액 환불 강경 요구' },
  { value: 'invalid_reason', label: '⑥ 사유 미해당/반복 반품' },
];

const SELLER_STANCES: { value: SellerStance; label: string }[] = [
  { value: 'none', label: '선택 안 함 (기타/일반 응대)' },
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
  const [customerComplaint, setCustomerComplaint] = useState<CustomerComplaint>('none');
  const [sellerStance, setSellerStance] = useState<SellerStance>('none');
  const [inquiry, setInquiry] = useState('');
  const [customInstruction, setCustomInstruction] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateResponse = async () => {
    if (!inquiry.trim() || !apiKey) return;
    setIsLoading(true);
    setGeneratedResponse('');

    try {
      const storeName = sender === 'yoon' ? '윤씨네 행복상회' : '맛능상회';
      const senderName = sender === 'yoon' ? '윤태성' : '레이첼';
      const isFresh = productType === 'fresh';
      const complaintLabel = CUSTOMER_COMPLAINTS.find(c => c.value === customerComplaint)?.label || '';
      const stanceLabel = SELLER_STANCES.find(s => s.value === sellerStance)?.label || '';

      const prompt = `
        당신은 온라인 쇼핑몰 [${storeName}]의 전문 CS 상담원입니다. 
        [지침] 발신자:${senderName}, 플랫폼:${platform}, 상품:${isFresh ? '신선식품' : '공산품'}, 불만유형:${complaintLabel}, 입장:${stanceLabel}, 문의:"${inquiry}"
        
        [필수 규칙]
        1. 첫 문장 고정: "안녕하세요, 고객님. ${storeName}입니다."
        2. 문의 내용 재언급 절대 금지. 호칭은 "고객님" 통일.
        3. 정중하고 차분한 비즈니스 톤 유지. (미사여구 배제)

        [핵심 로직]
        - ${customerComplaint === 'none' ? '불만 유형이 지정되지 않았으므로, 입력된 [문의] 내용과 [지시 사항]에만 근거하여 상황에 맞는 맞춤형 답변을 작성하세요.' : `[불만유형:${complaintLabel}]에 적합한 사과와 공감으로 시작하세요.`}
        
        - ${sellerStance === 'evidence_request' ? `
          반드시 아래 사진 3종 상세 안내를 포함하세요:
          "상품 수령 후 최대 48시간 이내에 아래 사진 3종을 첨부하여 문의해 주시면 확인 즉시 처리해 드리겠습니다.
          1. 제품의 운송장 사진: 송장 번호와 주소가 식별 가능해야 합니다.
          2. 전체 수량을 셀 수 있는 사진: 바둑판처럼 정렬하여 전체 개수가 한눈에 들어와야 합니다.
          3. 문제 상품 확인 사진: 문제 부위가 명확히 보이도록 여러 장 촬영 부탁드립니다."` : '이미 증빙이 완료되었거나 필요 없는 상황이므로 사진 요청 문구는 절대 넣지 마세요.'}

        - ${sellerStance === 'partial_proposal' ? '자료 확인 완료를 언급하고, 부분 환불 제안 및 동의 시 환불 계좌 요청 내용을 포함하세요.' : ''}
        - ${isFresh && sellerStance !== 'impossible' && ['broken', 'quality', 'size_appearance'].includes(customerComplaint) ? "'택배사 회수 불가(위생/오염)' 논리를 적용하여 자체 폐기를 정중히 요청하세요. 단, 환불 불가 상황이거나 단순 문의 시에는 절대 언급하지 마세요." : '공산품의 경우 일반적인 반품/교환 회수 절차를 안내하세요.'}
        - ${platform === 'toss' ? '토스 안내: 답변 수정 불가 및 안심번호 만료로 인한 소통 단절 안내, 추가 문의 시 "새로운 문의글" 작성 요청 포함.' : ''}
        
        [사진 분석 지침]
        - 만약 고객이 보낸 사진이 첨부되어 있다면, 사진 속 상품의 상태를 정밀하게 분석하세요.
        - 사진에 보이는 전체 과수(개수)와 파손/썩음/무름 등 문제가 있는 과수의 개수를 구체적으로 파악하여 답변에 언급하세요. (예: "보내주신 사진을 확인하니 전체 12과 중 3과 정도가 무른 상태인 것으로 확인됩니다.")
        - 분석한 내용을 바탕으로 보상안(부분 환불 등)의 근거로 삼으세요.

        [지시 사항 반영]
        ${customInstruction}

        [마무리]
        마지막에 "${storeName} 드림."으로 맺어주세요.
      `;

      const parts: any[] = [{ text: prompt }];
      
      if (image) {
        const base64Data = image.split(',')[1];
        const mimeType = image.split(';')[0].split(':')[1];
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] })
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

            <textarea value={inquiry} onChange={e => setInquiry(e.target.value)} placeholder="고객 문의 내용을 입력하세요 (예: 주소지 변경 요청 등)" className="w-full h-32 p-4 border rounded-xl resize-none text-sm outline-none focus:ring-1 focus:ring-stone-900" />
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">상품 상태 사진 첨부 (AI 분석용)</label>
              <div className="flex items-center gap-4">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="hidden" 
                  id="image-upload"
                />
                <label 
                  htmlFor="image-upload"
                  className="flex-1 p-3 border-2 border-dashed border-stone-200 rounded-xl text-center text-xs text-stone-500 cursor-pointer hover:bg-stone-50 transition-all"
                >
                  {image ? '사진 변경하기' : '클릭하여 사진 업로드'}
                </label>
                {image && (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-stone-200">
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setImage(null)}
                      className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg"
                    >
                      <Check size={10} className="rotate-45" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <textarea value={customInstruction} onChange={e => setCustomInstruction(e.target.value)} placeholder="AI 추가 지시 사항 (예: 주소지 변경 불가하니 재주문 안내해줘)" className="w-full h-16 p-3 border rounded-xl resize-none text-xs bg-stone-50/50" />

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