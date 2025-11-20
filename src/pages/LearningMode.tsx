import React, { useState } from "react";

// Import JSON files
import cppData from "../data/cpp.json";
import javaData from "../data/java.json";
import pythonData from "../data/python.json";

type Topic = {
  title: string;
  content: string;
};

// JSON must be an object, not an array
type JSONData = {
  topics: Topic[];
};

type Language = {
  id: number;
  name: string;
  description: string;
  icon_url?: string;
  topics: Topic[];
};

export default function LearningMode() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [topicIndex, setTopicIndex] = useState<number | null>(null);

  const languages: Language[] = [
    {
      id: 1,
      name: "C++",
      description: "Learn C++ from basics to advanced OOP and STL concepts.",
      icon_url:
        "https://upload.wikimedia.org/wikipedia/commons/1/18/ISO_C%2B%2B_Logo.svg",
      topics: (cppData as JSONData).topics,
    },
    {
      id: 2,
      name: "Java",
      description: "Master Java with OOP, Collections, and Threads.",
      icon_url:
        "https://upload.wikimedia.org/wikipedia/en/3/30/Java_programming_language_logo.svg",
      topics: (javaData as JSONData).topics,
    },
    {
      id: 3,
      name: "Python",
      description: "Learn Python from beginner to advanced concepts.",
      icon_url:
        "https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg",
      topics: (pythonData as JSONData).topics,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-6 text-center">Learning Mode</h1>

      {!selectedLanguage && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {languages.map((lang) => (
            <div
              key={lang.id}
              onClick={() => setSelectedLanguage(lang)}
              className="bg-blue-700 hover:bg-blue-800 transition rounded-xl p-6 cursor-pointer shadow-md text-center"
            >
              {lang.icon_url && (
                <img
                  src={lang.icon_url}
                  alt={lang.name}
                  className="w-16 h-16 mx-auto mb-4 rounded-full border border-gray-700"
                />
              )}
              <h2 className="text-2xl font-semibold mb-2">{lang.name}</h2>
              <p className="text-gray-300">{lang.description}</p>
            </div>
          ))}
        </div>
      )}

      {selectedLanguage && topicIndex === null && (
        <div className="max-w-3xl w-full">
          <button
            onClick={() => setSelectedLanguage(null)}
            className="text-blue-400 hover:underline mb-4"
          >
            ← Back to languages
          </button>

          <h2 className="text-3xl font-bold mb-6 text-center">
            {selectedLanguage.name} Topics
          </h2>

          <div className="grid gap-4">
            {selectedLanguage.topics.map((topic, idx) => (
              <div
                key={idx}
                onClick={() => setTopicIndex(idx)}
                className="bg-gray-800 hover:bg-gray-700 transition rounded-xl p-5 cursor-pointer"
              >
                <h3 className="text-xl font-semibold">{topic.title}</h3>
                <p className="text-gray-400 text-sm mt-1">Click to learn</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedLanguage && topicIndex !== null && (
        <div className="max-w-2xl bg-gray-800 p-6 rounded-xl shadow-lg">
          <button
            onClick={() => setTopicIndex(null)}
            className="text-blue-400 mb-4 hover:underline"
          >
            ← Back to {selectedLanguage.name} topics
          </button>

          <h2 className="text-2xl font-bold mb-3">
            {selectedLanguage.topics[topicIndex].title}
          </h2>

          <pre className="text-gray-200 mb-6 whitespace-pre-wrap">
            {selectedLanguage.topics[topicIndex].content}
          </pre>

          <div className="flex justify-between">
            <button
              disabled={topicIndex === 0}
              onClick={() => setTopicIndex(topicIndex - 1)}
              className={`px-4 py-2 rounded ${
                topicIndex === 0
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              ← Previous
            </button>

            <button
              disabled={topicIndex === selectedLanguage.topics.length - 1}
              onClick={() => setTopicIndex(topicIndex + 1)}
              className={`px-4 py-2 rounded ${
                topicIndex === selectedLanguage.topics.length - 1
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}