# eop_server_test
playing with ideas to run a flux in server realm

### basics ###
an `npm install` followed by `npm start` should be all you need to get it going. 

*  all `GET` requests are banned.
*  one `POST` route is available: `/request/bid/for/property`
*  one `PUT` route is availalbe: `/change/bid/on/property`
*  one `delete` route is available: `/cancel/bid/on/property`

### notes ###
*  not all routes do something. I am tinkering so shit may change. right now I think I have the `POST` method available.
*  dont ask why I have crazy route names. I am still pondering that. But I wanted to build in a parser to maybe stream line events. I might drop this bc it looks like I dont need it

### why you have been added as a colaborator ###
1.  Because I like you.
2.  I value your opinion.
3.  I want you to be able to merge back into master.
