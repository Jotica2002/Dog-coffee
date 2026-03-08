interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-3 px-4 py-3">
        <img 
          src="https://019cc691-5ce4-7d46-a508-14e94c4d56be.mochausercontent.com/logodogcoffee.jpg" 
          alt="Dog Coffee" 
          className="w-10 h-10 rounded-full object-cover shadow-md"
        />
        <div>
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
    </header>
  );
}
