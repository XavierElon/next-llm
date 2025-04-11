'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Problem {
  id: number
  title: string
  description: string
  difficulty: string
  category: string
  tags: string[]
  testCases: {
    id: number
    input: string
    expected: string
    description: string | null
  }[]
}

export default function ProblemsPage() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)

  const difficulties = ['all', 'Easy', 'Medium', 'Hard']
  const categories = ['all', 'Algorithms', 'Data Structures']

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/problems?difficulty=${selectedDifficulty}&category=${selectedCategory}`)
        const data = await response.json()
        setProblems(data)
      } catch (error) {
        console.error('Error fetching problems:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProblems()
  }, [selectedDifficulty, selectedCategory])

  return (
    <div className="p-8 bg-[#1b1c1d] text-white min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Coding Problems</h1>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)} className="bg-[#2d2e2f] text-white px-4 py-2 rounded-lg border border-gray-700">
            {difficulties.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty === 'all' ? 'All Difficulties' : difficulty}
              </option>
            ))}
          </select>

          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-[#2d2e2f] text-white px-4 py-2 rounded-lg border border-gray-700">
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>

        {/* Problems List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading problems...</div>
          ) : problems.length === 0 ? (
            <div className="text-center py-8">No problems found</div>
          ) : (
            problems.map((problem) => (
              <Link href={`/code?problem=${problem.id}`} key={problem.id} className="block bg-[#2d2e2f] rounded-lg p-6 hover:bg-[#3d3e3f] transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">{problem.title}</h2>
                    <p className="text-gray-400 mb-4">{problem.description}</p>
                    <div className="flex gap-2">
                      {problem.tags.map((tag) => (
                        <span key={tag} className="bg-[#1b1c1d] text-gray-400 px-3 py-1 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${problem.difficulty === 'Easy' ? 'bg-green-900 text-green-300' : problem.difficulty === 'Medium' ? 'bg-yellow-900 text-yellow-300' : 'bg-red-900 text-red-300'}`}>{problem.difficulty}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
