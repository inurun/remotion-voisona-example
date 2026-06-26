import { Sequence, SequenceProps } from "remotion";

export function SequenceUnstyled({ children, ...props }: SequenceProps) {
  return (
    <Sequence layout="none" {...props}>
      {children}
    </Sequence>
  );
}
