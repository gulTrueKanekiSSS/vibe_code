#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <limits.h>

/* Only reviewed, defined C11 traces. Never run the UB classification examples. */
static int next(void) { static int n; return ++n; }
static void swap_values(int *a,int *b) {int t=*a;*a=*b;*b=t;}
static void choose(int *p,int *other) {p=other;*p=9;}
static void redirect(int **slot,int *target) {*slot=target;}
static void double_prefix(int a[],int n) {for(int i=0;i<n;++i)a[i]*=2;}
struct Box {int n;};
static void by_value(struct Box b) {b.n=9; (void)b;}
static void by_address(struct Box *b) {b->n+=3;}
struct Point {int x,y;};
static struct Point shifted(struct Point p) {p.x+=2;p.y-=1;return p;}
static int increment(int x) {return x+1;}
static int triple(int x) {return 3*x;}
static int add(int a,int b) {return a+b;}
static int subtract(int a,int b) {return a-b;}
static int magnitude(int x) {return x<0 ? -x : x;}
static void transform(int *a,int n,int (*f)(int)) {for(int i=0;i<n;++i)a[i]=f(a[i]);}
static int negate(int x) {return -x;}
static int twice(int (*f)(int),int x) {return f(f(x));}
static int calls;
static int counted(int x) {++calls;return x+1;}
int main(void) {
    { int a[4]={7}; printf("arrays-min10-01|%d %d\n",a[0],a[3]); }
    { int a[]={2,4,6,8,10}; printf("arrays-min10-02|%zu\n",sizeof a/sizeof a[0]); }
    { int a[]={3,-1,4,-2},sum=0; for(int i=0;i<4;++i) if(a[i]>0)sum+=a[i]; printf("arrays-min10-03|%d\n",sum); }
    { int a[]={1,2,3,4}; for(int i=1;i<4;++i)a[i]+=a[i-1]; printf("arrays-min10-05|%d %d %d %d\n",a[0],a[1],a[2],a[3]); }
    { int m[2][3]={{1,2,3},{4,5,6}},s=0; for(int row=0;row<2;++row)s+=m[row][1]; printf("arrays-min10-06|%d\n",s); }
    { int a[]={2,5,8,11}; for(int i=0;i<2;++i){int t=a[i];a[i]=a[3-i];a[3-i]=t;} printf("arrays-min10-08|%d %d %d %d\n",a[0],a[1],a[2],a[3]); }
    { char s[8]="cat"; printf("strings-min10-02|%zu %zu\n",sizeof s,strlen(s)); }
    { char s[]="stone";s[2]='\0';printf("strings-min10-03|%s\n",s); }
    { printf("strings-min10-04|%zu\n",strlen("abcd")+strlen("efg")+1); }
    { char s[]={'A','\0','B','\0'};printf("strings-min10-06|%zu %c\n",strlen(s),s[2]); }
    { char s[]="abcde";memmove(s+1,s,3);printf("strings-min10-09|%s\n",s); }
    { FILE *f=tmpfile();if(!f)return 2;if(fputs("abcd\n",f)==EOF)return 3;rewind(f);char s[4];if(!fgets(s,sizeof s,f))return 4;printf("files-min10-06|%zu %s\n",strlen(s),s);if(fclose(f)==EOF)return 5; }
    { int x=6,y=x;x=2;printf("variables-min10-01|%d %d\n",x,y); }
    { int x=4;printf("variables-min10-02|");{int x=9;x+=1;printf("%d ",x);}printf("%d\n",x); }
    { int a=next(),b=next();printf("variables-min10-04|%d %d\n",a,b); }
    { double price=7.9;int whole=price;printf("variables-min10-05|%d\n",whole); }
    { int a=3,b=8,t=a;a=b;b=t;printf("variables-min10-07|%d %d %d\n",a,b,t); }
    { printf("operators-min10-01|%d %d\n",-7/3,-7%3); }
    { int x=0,y=4,r=x && ++y;printf("operators-min10-02|%d %d\n",r,y); }
    { int x=2+3*4;printf("operators-min10-03|%d\n",x); }
    { int x=0;printf("operators-min10-04|");if((x=5))printf("%d",x);else printf("zero");printf("\n"); }
    { int a=2,b=5,r=(a>b)?++a:++b;printf("operators-min10-05|%d %d %d\n",a,b,r); }
    { int x=1,y=(x+=2,x*3);printf("operators-min10-06|%d %d\n",x,y); }
    { int a=5,b=2;double r=(double)a/b;printf("operators-min10-07|%.1f\n",r); }
    { unsigned f=8u;printf("c-bitwise-min10-01|%u\n",f|(1u<<1)); }
    { unsigned f=15u;f &= ~(1u<<2);printf("c-bitwise-min10-02|%u\n",f); }
    { unsigned f=5u;f ^= 3u;printf("c-bitwise-min10-03|%u ",f);f ^= 3u;printf("%u\n",f); }
    { unsigned a=4u,b=2u;printf("c-bitwise-min10-04|%u %d\n",a&b,a&&b); }
    { unsigned word=0xB6u;printf("c-bitwise-min10-05|%u\n",(word>>2)&7u); }
    { unsigned word=0xA5u;printf("c-bitwise-min10-06|%u\n",(word & ~15u)|3u); }
    { int x=3,y=8;swap_values(&x,&y);printf("pointers-min10-01|%d %d\n",x,y); }
    { int x=4,y=7;int *p=&x;choose(p,&y);printf("pointers-min10-02|%d %d %d\n",x,y,*p); }
    { int a=2,b=7;int *p=&a;redirect(&p,&b);*p=11;printf("pointers-min10-03|%d %d\n",a,b); }
    { int a[]={2,3,5,7};double_prefix(a,2);printf("pointers-arrays-min10-02|%d %d %d %d\n",a[0],a[1],a[2],a[3]); }
    { int a[]={3,5,8,11};int *p=a,*end=a+4;while(p!=end && *p%2!=0)++p;printf("pointers-arrays-min10-03|%td %d\n",p-a,*p); }
    { int x=4,y=7;int *refs[]={&x,&y};*refs[0]+=*refs[1];printf("pointers-arrays-min10-05|%d %d\n",x,y); }
    { int m[3][3]={{1,2,3},{4,5,6},{7,8,9}};int (*row)[3]=m;int sum=0;for(int i=0;i<3;++i,++row)sum+=(*row)[i];printf("pointers-arrays-min10-07|%d\n",sum); }
    { int a[]={1,2,3,4,5};int *left=a+1,*right=a+3;while(left<right){int t=*left;*left=*right;*right=t;++left;--right;}printf("pointers-arrays-min10-09|%d %d %d %d %d\n",a[0],a[1],a[2],a[3],a[4]); }
    { struct Sample {int x,y,z;};struct Sample s={.y=6};printf("structs-min10-01|%d %d %d\n",s.x,s.y,s.z); }
    { struct Segment {struct Point start,end;};struct Segment s={{1,2},{3,4}};struct Segment *p=&s;p->end.y+=p->start.y*2;printf("structs-min10-02|%d %d\n",s.end.x,s.end.y); }
    { struct Box b={2};by_value(b);printf("structs-min10-03|%d ",b.n);by_address(&b);printf("%d\n",b.n); }
    { struct Name {char text[8];};struct Name a={"cat"};struct Name b=a;b.text[0]='b';printf("structs-min10-04|%s %s\n",a.text,b.text); }
    { struct Point a={3,5},b=shifted(a);printf("structs-min10-06|%d %d %d %d\n",a.x,a.y,b.x,b.y); }
    { struct Node {int value;struct Node *next;};struct Node tail={5,NULL};struct Node head={4,&tail};int sum=0;for(struct Node *p=&head;p!=NULL;p=p->next)sum+=p->value;printf("structs-min10-07|%d\n",sum); }
    { int *p=calloc(3,sizeof *p);if(!p)return 6;p[0]=3;p[2]=p[0]+1;printf("malloc-min10-03|%d %d %d\n",p[0],p[1],p[2]);free(p); }
    { int *p=malloc(2*sizeof *p);if(!p)return 7;p[0]=6;p[1]=7;int *tmp=realloc(p,3*sizeof *p);if(!tmp){free(p);return 8;}p=tmp;p[2]=8;printf("malloc-min10-05|%d %d %d\n",p[0],p[1],p[2]);free(p); }
    { int mode=1;int (*f)(int)=mode ? triple : increment;printf("function-pointers-min10-02|%d\n",f(4)); }
    { int (*ops[2])(int,int)={add,subtract};printf("function-pointers-min10-03|%d\n",ops[1](9,4)); }
    { int a[]={-2,3,-4};transform(a,3,magnitude);printf("function-pointers-min10-04|%d %d %d\n",a[0],a[1],a[2]); }
    { printf("function-pointers-min10-07|%d\n",twice(negate,3)); }
    { int (*f)(int)=counted;printf("function-pointers-min10-08|%d ",calls);int r=f(5);printf("%d %d\n",r,calls); }
    return 0;
}
