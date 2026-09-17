import "./index.css";
import { Composition } from "remotion";
import { JevegisDemo, TOTAL_FRAMES } from "./Demo";

export const RemotionRoot: React.FC = () => (
  <Composition id="JevegisDemo" component={JevegisDemo} durationInFrames={TOTAL_FRAMES} fps={30} width={1920} height={1080} />
);
