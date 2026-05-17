import { Link } from 'react-router-dom';

export default function Logo({ size = 'md', linkTo = '/' }) {
  const sizes = {
    sm: { box: 'w-7 h-7 rounded-xl', letter: 'text-sm', text: 'text-lg' },
    md: { box: 'w-8 h-8 rounded-xl', letter: 'text-sm', text: 'text-xl' },
    lg: { box: 'w-10 h-10 rounded-2xl', letter: 'text-base', text: 'text-2xl' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <Link to={linkTo} className="flex items-center gap-2.5 select-none">
      <div
        className={`${s.box} flex items-center justify-center flex-shrink-0`}
        style={{ background: 'linear-gradient(135deg, #0066FF 0%, #005BFF 100%)' }}
      >
        <span className={`text-white font-extrabold ${s.letter} tracking-tight`}>Z</span>
      </div>
      <span
        className={`font-extrabold ${s.text} tracking-tight`}
        style={{ color: '#0055EE' }}
      >
        ZEAL
      </span>
    </Link>
  );
}
