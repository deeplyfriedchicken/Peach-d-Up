import React from "react";
import { Series } from "remotion";
import { VideoOverlay, type VideoOverlayProps } from "../Composition";
import { SummarySlide, type SummarySlideProps } from "../components/SummarySlide";

export interface FinalVideoProps {
  videoOverlayProps: VideoOverlayProps;
  videoDurationInFrames: number;
  summarySlideProps: SummarySlideProps;
  summaryDurationInFrames: number;
  summaryEnabled: boolean;
}

export const FinalVideo: React.FC<FinalVideoProps> = ({
  videoOverlayProps,
  videoDurationInFrames,
  summarySlideProps,
  summaryDurationInFrames,
  summaryEnabled,
}) => {
  return (
    <Series>
      <Series.Sequence durationInFrames={videoDurationInFrames}>
        <VideoOverlay {...videoOverlayProps} />
      </Series.Sequence>
      {summaryEnabled && summaryDurationInFrames > 0 && (
        <Series.Sequence durationInFrames={summaryDurationInFrames}>
          <SummarySlide {...summarySlideProps} />
        </Series.Sequence>
      )}
    </Series>
  );
};
