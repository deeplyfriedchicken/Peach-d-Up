import "./index.css";
import { Composition } from "remotion";
import { VideoOverlay } from "./Composition";
import { SummarySlide } from "./components/SummarySlide";
import { FinalVideo } from "./compositions/FinalVideo";

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
      <Composition
        id="SummarySlide"
        component={SummarySlide}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          items: [],
        }}
      />
      <Composition
        id="FinalVideo"
        component={FinalVideo}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          clips: [],
          overlayProps: {
            overlaySrc: "",
            overlayX: 5,
            overlayY: 5,
            overlayWidth: 20,
            overlayHeight: 20,
            overlayDuration: 5,
            fadeDuration: 1,
          },
          summarySlideProps: { items: [] },
          summaryDurationInFrames: 150,
          summaryEnabled: false,
        }}
      />
    </>
  );
};
