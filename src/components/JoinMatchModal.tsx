import { useState } from "react";


interface Props {
  onClose: () => void;
  onJoin: (code: string) => void;
}

export default function JoinMatchModal({ onClose, onJoin }: Props) {
  const [code, setCode] = useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-xl text-white w-80 space-y-4">
        <h2 className="text-xl font-bold">Join Match</h2>

        <input
          className="w-full p-2 rounded bg-gray-700"
          placeholder="Enter match code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />

        <div className="flex justify-between">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded">
            Cancel
          </button>

          <button
            onClick={() => onJoin(code)}
            className="px-4 py-2 bg-blue-600 rounded"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
}
