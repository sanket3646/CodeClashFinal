// src/data/problems.ts
export const PROBLEMS: Record<
  "Beginner" | "Intermediate" | "Advanced",
  {
    id: string;
    title: string;
    description: string;
    testcases: { input: string; expected: string }[];
  }[]
> = {
  Beginner: [
    {
      id: "sum-two-numbers",
      title: "Sum of Two Numbers",
      description: "Given two integers, return their sum.",
      testcases: [
        { input: "2 3", expected: "5" },
        { input: "10 20", expected: "30" },
      ],
    },
    {
      id: "max-of-two",
      title: "Maximum of Two Numbers",
      description: "Given two integers, return the larger one.",
      testcases: [
        { input: "2 3", expected: "3" },
        { input: "10 7", expected: "10" },
      ],
    },
  ],

  Intermediate: [
    {
      id: "reverse-string",
      title: "Reverse a String",
      description: "Given a string, return its reverse.",
      testcases: [
        { input: "hello", expected: "olleh" },
        { input: "abc", expected: "cba" },
      ],
    },
    {
      id: "count-vowels",
      title: "Count Vowels",
      description: "Given a string, return number of vowels.",
      testcases: [
        { input: "hello", expected: "2" },
        { input: "sky", expected: "0" },
      ],
    },
  ],

  Advanced: [
    {
      id: "two-sum",
      title: "Two Sum",
      description:
        "Return indices of two numbers that add up to the target. Use 'numbers | target' format for input.",
      testcases: [
        { input: "2 7 11 15 | 9", expected: "0 1" },
        { input: "3 2 4 | 6", expected: "1 2" },
      ],
    },
    {
      id: "valid-parentheses",
      title: "Valid Parentheses",
      description:
        "Return true or false for valid parentheses string. Only '(){}[]' characters appear.",
      testcases: [
        { input: "()", expected: "true" },
        { input: "([)]", expected: "false" },
      ],
    },
  ],
};
