export function Divider() {
  return (
    <div className="relative w-full h-24 my-8">
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-green-400/50 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-green-400/50 to-transparent" />
      <div className="absolute top-1/2 h-px bg-gradient-to-l via-transparent from-green-400/50 to-green-400/50 -inset-x-4" />
    </div>
  );
}
