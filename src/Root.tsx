import "./index.css";
import { Composition } from "remotion";
import { VideoOverlay } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VideoOverlay"
        component={VideoOverlay}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          videoSrc: "",
          overlaySrc: "",
          overlayX: 5,
          overlayY: 5,
          overlayWidth: 20,
          overlayHeight: 20,
          overlayDuration: 5,
          fadeDuration: 1,
        }}
      />
    </>
  );
};
