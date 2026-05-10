// Header: only rendered inside pages for a page-title row on desktop.
// On mobile the AppLayout MobileHeader handles navigation chrome.
interface HeaderProps {
  title?: string;
  actions?: React.ReactNode;
}

const Header = ({ title, actions }: HeaderProps) => {
  if (!title && !actions) return null;

  return (
    <div className="hidden lg:flex items-end justify-between gap-6 mb-7 pb-6 border-b border-border">
      {title && (
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 40, lineHeight: 1, margin: 0, letterSpacing: '-0.01em' }}>
          {title}
        </h1>
      )}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

export default Header;
