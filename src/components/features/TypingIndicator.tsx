import logoImg from '@/assets/mocka-logo.png';

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 animate-message-in">
      <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 ring-1 ring-[hsl(191_97%_55%_/_0.4)]">
        <img src={logoImg} alt="Mock A" className="w-full h-full object-cover" />
      </div>
      <div className="bg-[hsl(224_15%_14%)] border border-border rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[hsl(191_97%_55%)]"
              style={{
                animation: `typing-dot 1.2s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
