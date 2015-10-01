# Poffer
Programming language with a focus on point-free (tacit) programming.

# Examples
```python
;; average
{sum div len}

;; euler 1
[1..999 filter/{divisible\3 or divisible\5} sum]

;; divisors
{//divisible filter to/1}

;; isPrime
{//divisible count to/1 eq 2}
```
