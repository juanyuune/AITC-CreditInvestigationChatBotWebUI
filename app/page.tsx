import { ChatWindow } from "@/components/ChatWindow";
import { GuideInfoBox } from "@/components/guide/GuideInfoBox";

export default function Home() {
  const InfoCard = (
    <GuideInfoBox>
      <ul>
        <li className="text-l">
          <span className="ml-2">
            支援多輪對話與上下文追問，例如：<code>那跟同業比呢？</code>
          </span>
        </li>
        <li className="hidden text-l md:block">
          <span className="ml-2">
            右側設定欄可選擇公司與期間，問題會自動加上前綴再發送給 AI Agent。
          </span>
        </li>
        <li className="text-l">
          <span className="ml-2">
            每則回答下方會顯示：<code>🔒 On-premise</code>（私有資料）或 <code>☁️ Cloud</code>（公開資料）。
          </span>
        </li>
        <li className="hidden text-l md:block">
          <span className="ml-2">
            可上傳 PDF、Word、Excel 文件作為查詢來源，上傳後即可直接追問。
          </span>
        </li>
        <li className="text-l">
          <span className="ml-2">
            快速測試：<code>台泥 2024年Q1 的現金及約當現金</code>
          </span>
        </li>
      </ul>
    </GuideInfoBox>
  );

  return (
    <ChatWindow
      endpoint="api/chat"
      emoji="🤖"
      placeholder="請輸入授信調查問題，例如：台泥 2024年Q1 現金及約當現金"
      emptyStateComponent={InfoCard}
      showIngestForm={true}
      presetQuestions={[
        "現金水位是否充足？",
        "獲利能力與負債結構是否有風險？",
        "近三期營收與獲利趨勢是否惡化？",
        "各季營收趨勢如何？是否持續成長？",
        "應收帳款淨額為何？",
      ]}
    />
  );
}
