export default function Header({ userEmail, onAbmelden }) {
  return (
    <header className="flex items-center justify-between bg-anthrazit px-4 py-3 shadow-md">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-white">RoutenKompass</span>
      </div>
      {userEmail && (
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-gray-300 sm:inline">{userEmail}</span>
          <button
            type="button"
            onClick={onAbmelden}
            className="min-h-[44px] rounded bg-stahlblau px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Abmelden
          </button>
        </div>
      )}
    </header>
  );
}
