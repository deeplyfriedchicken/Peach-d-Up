import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface VideoOverlayProps {
  videoSrc: string;
  overlaySrc: string;
  overlayX: number;
  overlayY: number;
  overlayWidth: number;
  overlayHeight: number;
  overlayDuration: number;
  fadeDuration: number;
}

export const VideoOverlay: React.FC<VideoOverlayProps> = ({
  videoSrc,
  overlaySrc,
  overlayX,
  overlayY,
  overlayWidth,
  overlayHeight,
  overlayDuration,
  fadeDuration,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const overlayEndFrame = overlayDuration * fps;
  const fadeStartFrame = overlayEndFrame - fadeDuration * fps;

  const opacity =
    frame >= overlayEndFrame
      ? 0
      : frame >= fadeStartFrame
        ? interpolate(frame, [fadeStartFrame, overlayEndFrame], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        : 1;

  return (
    <AbsoluteFill>
      <AbsoluteFill>
        <OffthreadVideo src={videoSrc} />
      </AbsoluteFill>

      {overlaySrc && opacity > 0 && (
        <Img
          src={overlaySrc}
          style={{
            position: "absolute",
            left: `${overlayX}%`,
            top: `${overlayY}%`,
            width: `${overlayWidth}%`,
            height: `${overlayHeight}%`,
            objectFit: "contain",
            opacity,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
