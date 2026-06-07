interface AriaLiveRegionProps {
  message: string;
}

export function AriaLiveRegion({ message }: AriaLiveRegionProps) {
  return (
    <div
      aria-live="assertive"
      role="status"
      aria-atomic="true"
      className="sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
      style={{ clip: 'rect(0, 0, 0, 0)' }}
    >
      {message}
    </div>
  );
}
