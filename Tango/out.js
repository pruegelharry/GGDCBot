var p=Object.create;var t=Object.defineProperty;var g=Object.getOwnPropertyDescriptor;var m=Object.getOwnPropertyNames;var s=Object.getPrototypeOf,v=Object.prototype.hasOwnProperty;var P=(o,f)=>()=>(f||o((f={exports:{}}).exports,f),f.exports);var b=(o,f,r,e)=>{if(f&&typeof f=="object"||typeof f=="function")for(let i of m(f))!v.call(o,i)&&i!==r&&t(o,i,{get:()=>f[i],enumerable:!(e=g(f,i))||e.enumerable});return o};var k=(o,f,r)=>(r=o!=null?p(s(o)):{},b(f||!o||!o.__esModule?t(r,"default",{value:o,enumerable:!0}):r,o));var u=P((j,a)=>{"use strict";a.exports=n;var l=[""," ","  ","   ","    ","     ","      ","       ","        ","         "];function n(o,f,r){if(o=o+"",f=f-o.length,f<=0)return o;if(!r&&r!==0&&(r=" "),r=r+"",r===" "&&f<10)return l[f]+o;for(var e="";f&1&&(e+=r),f>>=1,f;)r+=r;return e+o}});var d=k(u(),1),w=(0,d.default)("foo",5);console.log(w);