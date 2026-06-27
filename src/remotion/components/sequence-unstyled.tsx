import { Sequence, SequenceProps } from "remotion";

export function SequenceUnstyled({ children, from, durationInFrames, ...props }: SequenceProps) {
  return (
    <Sequence layout="none" from={from} durationInFrames={durationInFrames} {...props}>
      {children}
    </Sequence>
  );
}
