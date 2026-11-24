# Coding and SQL by hand

Do these on the laptop. **AI off.** Timer on. Speak while you type.

## How to solve a coding task (say every step aloud)
1. Repeat the task in your words.
2. Ask: input size? empty input? duplicates?
3. Say a simple solution first, even if slow.
4. Then make it better. Say why.
5. Write the code.
6. Test with a small example, by hand.
7. Say the complexity: time and memory.

## Coding list (Java and Python)
Start with easy. Go on only when it works in under 15 minutes.

| # | Task | Pattern | Level |
|---|---|---|---|
| 1 | Two Sum | hash map | easy |
| 2 | Valid Anagram | count map | easy |
| 3 | Contains Duplicate | set | easy |
| 4 | Valid Parentheses | stack | easy |
| 5 | Best Time to Buy and Sell Stock | one pass | easy |
| 6 | Merge Two Sorted Lists | two pointers | easy |
| 7 | Group Anagrams | map of lists | medium |
| 8 | Top K Frequent Elements | heap / buckets | medium |
| 9 | Longest Substring Without Repeating Characters | sliding window | medium |
| 10 | Merge Intervals | sort + sweep | medium |
| 11 | Product of Array Except Self | prefix | medium |
| 12 | Number of Islands | BFS / DFS | medium |
| 13 | LRU Cache | map + list | medium |
| 14 | Parse a CSV file and sum per customer | practical | easy |
| 15 | REST endpoint with a unit test (Spring Boot) | practical | medium |
| 16 | Read a big file line by line, count words | streaming | medium |

Find the tasks by name on LeetCode (free). Do each one twice: once in Java, once in Python.

## SQL list (PostgreSQL)
Write on paper first. Then check in `psql`.

| # | Task | Pattern |
|---|---|---|
| 1 | All customers with their orders, also customers without orders | LEFT JOIN |
| 2 | Total sales per month | GROUP BY + date_trunc |
| 3 | Customers with more than 5 orders | HAVING |
| 4 | Top 3 products per category | ROW_NUMBER() OVER (PARTITION BY …) |
| 5 | Keep only the newest row per customer | ROW_NUMBER, rn = 1 |
| 6 | Running total of sales per day | SUM() OVER (ORDER BY …) |
| 7 | Difference to the previous day | LAG() |
| 8 | Find duplicate emails | GROUP BY … HAVING COUNT(*) > 1 |
| 9 | Longest streak of login days | gaps and islands |
| 10 | Customers who bought A but never B | NOT EXISTS |
| 11 | Second highest salary | DENSE_RANK |
| 12 | Read a field from a JSONB column and filter by it | ->> operator |
| 13 | Make query 4 fast: which index? | composite index |
| 14 | Read an EXPLAIN ANALYZE output | Seq Scan vs Index Scan |
| 15 | Two transactions update the same row: what happens? | locks, isolation |

## Example: top 3 products per category
```
SELECT category, product, sales
FROM (
  SELECT category, product, sales,
         ROW_NUMBER() OVER (PARTITION BY category ORDER BY sales DESC) AS rn
  FROM product_sales
) x
WHERE rn <= 3;
```
Say it aloud: „Ich nummeriere die Produkte pro Kategorie nach Umsatz. Dann behalte ich die ersten drei.“
