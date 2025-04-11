import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.testCase.deleteMany()
  await prisma.problem.deleteMany()

  // Create problems with test cases
  const problems = [
    {
      title: 'FizzBuzz',
      description: 'Write a function that prints numbers from 1 to n. For multiples of 3, print "Fizz"; for multiples of 5, print "Buzz"; for multiples of both, print "FizzBuzz".',
      difficulty: 'Easy',
      category: 'Algorithms',
      tags: ['Math', 'Conditionals'],
      functionName: 'fizz_buzz_solution',
      testCases: [
        {
          input: '3',
          expected: 'Fizz',
          description: 'Divisible by 3'
        },
        {
          input: '5',
          expected: 'Buzz',
          description: 'Divisible by 5'
        },
        {
          input: '15',
          expected: 'FizzBuzz',
          description: 'Divisible by both 3 and 5'
        },
        {
          input: '7',
          expected: '7',
          description: 'Not divisible by 3 or 5'
        }
      ]
    },
    {
      title: 'Two Sum',
      description: 'Given an array of integers and a target sum, find two numbers that add up to the target.',
      difficulty: 'Easy',
      category: 'Algorithms',
      tags: ['Arrays', 'Hash Table'],
      functionName: 'two_sum_solution',
      testCases: [
        {
          input: '[2,7,11,15]\n9',
          expected: '[0,1]',
          description: 'Basic case'
        },
        {
          input: '[3,2,4]\n6',
          expected: '[1,2]',
          description: 'Multiple solutions'
        },
        {
          input: '[3,3]\n6',
          expected: '[0,1]',
          description: 'Same number twice'
        }
      ]
    },
    {
      title: 'Reverse Linked List',
      description: 'Reverse a singly linked list.',
      difficulty: 'Medium',
      category: 'Data Structures',
      tags: ['Linked List', 'Recursion'],
      functionName: 'reverse_linked_list_solution',
      testCases: [
        {
          input: '[1,2,3,4,5]',
          expected: '[5,4,3,2,1]',
          description: 'Basic case'
        },
        {
          input: '[1,2]',
          expected: '[2,1]',
          description: 'Two nodes'
        },
        {
          input: '[]',
          expected: '[]',
          description: 'Empty list'
        }
      ]
    }
  ]

  for (const problem of problems) {
    await prisma.problem.create({
      data: {
        title: problem.title,
        description: problem.description,
        difficulty: problem.difficulty,
        category: problem.category,
        tags: problem.tags,
        functionName: problem.functionName,
        testCases: {
          create: problem.testCases
        }
      }
    })
  }

  console.log('Database has been seeded. 🌱')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
