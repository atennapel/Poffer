# Poffer
Programming language with a focus on point-free (tacit) programming.

# Examples
```ruby
;; average
{sum div len}

;; euler 1
[1..999 filter/{divisible\3 or divisible\5} sum]

;; divisors
{//divisible filter to/1}

;; isPrime
{//divisible count to/1 eq 2}

;; fizzbuzz
[
	1..100
	? {
		divisible\15 "FizzBuzz"
		divisible\3 "Fizz"
		divisible\5 "Buzz"
	}
	join/"\n"
	log
] 
```
