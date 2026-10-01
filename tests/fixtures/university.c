/* Reviewed deterministic examples only. No learner-supplied code is executed. */
#include <stdio.h>

static int sum(int n) { if (n == 0) return 0; return n + sum(n - 1); }
static int digits(int n) { if (n == 0) return 0; return n % 10 + digits(n / 10); }
static void before(int n) { if (!n) return; printf("%d", n); before(n - 1); }
static void after(int n) { if (!n) return; after(n - 1); printf("%d", n); }
static void both(int n) { if (!n) return; printf("%d", n); both(n - 1); printf("%d", n); }
static int count_calls(int n) { static int calls = 0; ++calls; if (!n) return calls; return count_calls(n - 1); }
static int local_sum(int n) { if (!n) return 0; int x = n; int y = local_sum(n - 1); return x + y; }
static int shared_sum(int n) { static int x = 0; if (!n) return x; ++x; int r = shared_sum(n - 1); return r + x; }
static int fib_calls;
static int fib(int n) { ++fib_calls; if (n < 2) return n; int a = fib(n - 1); int b = fib(n - 2); return a + b; }

int main(void) {
  printf("recursion-u03|%d\n", sum(3));
  printf("recursion-u04|"); before(3); puts("");
  printf("recursion-u05|"); after(3); puts("");
  printf("recursion-u07|%d\n", digits(407));
  int first = count_calls(2); int second = count_calls(1);
  printf("recursion-u09|%d %d\n", first, second);
  printf("recursion-u10|%d\n", local_sum(3));
  printf("recursion-u11|"); both(2); puts("");
  (void)fib(4); printf("recursion-u12|%d\n", fib_calls);
  printf("recursion-u13|%d\n", shared_sum(2));
  struct P { int x, y; }; struct P a = {2, 5}; struct P b = a; b.x = 9;
  printf("aggregate-types-u01|%d\n", a.y);
  enum State { IDLE = 2, RUNNING, DONE };
  printf("aggregate-types-u02|%d\n", DONE);
  printf("aggregate-types-u04|%d,%d\n", a.x, b.x);
  struct X { int x; }; struct X arr[3] = {{4}, {7}, {9}}; struct X *p = arr + 1;
  p->x += 2; printf("aggregate-types-u05|%d\n", arr[1].x);
  unsigned word = 13u;
  printf("aggregate-types-u08|%u\n", word & 7u);
  printf("aggregate-types-u09|%u\n", (5u & 7u) | ((1u & 1u) << 3));
  printf("aggregate-types-u10|%u\n", (word & ~7u) | 2u);
  int x = 4; struct Box { int *p; }; struct Box box_a = {&x}; struct Box box_b = box_a;
  *box_b.p = 9; printf("aggregate-types-u12|%d\n", *box_a.p);
  int nums1[] = {10,20,30}; int *p1 = nums1; int r1 = ++*p1;
  int nums2[] = {10,20,30}; int *p2 = nums2; int r2 = *++p2;
  printf("pointer-arithmetic-u01|%d,%td,%d,%td\n", r1, p1-nums1, r2, p2-nums2);
  int nums3[] = {10,20,30}; int *p3 = nums3; int r3 = *p3++;
  printf("pointer-arithmetic-u02|%d,%td,%d\n", r3, p3-nums3, nums3[0]);
  int nums4[] = {3,6,9}; int *p4 = nums4; ++*p4; ++p4; *p4 += nums4[0];
  printf("pointer-arithmetic-u03|%d %d\n", nums4[0], nums4[1]);
  int grid[2][3] = {{1,2,3},{4,5,6}}; int (*row)[3] = grid;
  printf("pointer-arithmetic-u04|%d\n", (*++row)[1]);
  int nums5[5] = {0}; int *end = nums5+5; --end; *end=7;
  printf("pointer-arithmetic-u06|%d\n", nums5[4]);
  int nums6[] = {7,8,9}; int *p6=nums6; int **q=&p6; ++*q;
  printf("pointer-arithmetic-u11|%d\n", **q);
  return 0;
}
