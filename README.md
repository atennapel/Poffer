# Poffer
Programming language with a focus on point-free (tacit) programming.

# Examples
```ruby
average {sum div len}
euler1 [1..999 filter/{divisible\3 or divisible\5} sum]
divisors {divisible filter 1..}
isPrime {divisible count (1..) eq 2}
isPrimeEfficient ?{{negative or even} eq/2 {divisible none 3, 2 ^.. sqrt}}
fizzBuzz [
  1..100
  map/?{
    divisible\15 "FizzBuzz"
    divisible\3 "Fizz"
    divisible\5 "Buzz"
  }
  join/"\n"
  log
]
```

