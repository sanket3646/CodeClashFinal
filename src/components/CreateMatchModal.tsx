import { useState } from "react";

interface Props {
  onClose: () => void;
  onCreate: (
    difficulty: "Beginner" | "Intermediate" | "Advanced"
  ) => void;
}

export default function CreateMatchModal({ onClose, onCreate }: Props) {
  const [difficulty, setDifficulty] = useState<
    "Beginner" | "Intermediate" | "Advanced"
  >("Beginner");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-xl text-white w-80 space-y-4">
        <h2 className="text-xl font-bold">Create Match</h2>

        <select
          className="w-full p-2 rounded bg-gray-700"
          value={difficulty}
          onChange={(e) =>
            setDifficulty(
              e.target.value as "Beginner" | "Intermediate" | "Advanced"
            )
          }
        >
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>

        <div className="flex justify-between">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded">
            Cancel
          </button>

          <button
            onClick={() => onCreate(difficulty)}
            className="px-4 py-2 bg-green-600 rounded"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
