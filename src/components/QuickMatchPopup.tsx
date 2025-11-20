
interface Props {
  onClose: () => void;
  onCreate: () => void;
  onJoin: () => void;
}

export default function QuickMatchPopup({ onClose, onCreate, onJoin }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-xl text-white w-80 space-y-6 border border-gray-700">
        
        <h2 className="text-2xl font-bold text-center">Quick Match</h2>

        <button
          onClick={onCreate}
          className="w-full bg-green-600 hover:bg-green-700 p-3 rounded-lg text-lg font-semibold"
        >
          Create Match
        </button>

        <button
          onClick={onJoin}
          className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg text-lg font-semibold"
        >
          Join Match
        </button>

        <button
          onClick={onClose}
          className="w-full bg-gray-600 hover:bg-gray-700 p-2 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
