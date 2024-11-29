class NewPromise extends Promise
{
   constructor(executor)
   {
      super((resolve, reject) =>  executor(resolve, reject));
	}
   then(onFulfilled, onRejected)
   {
		 console.log(this.constructor.name);
       return super.then(onFulfilled, onRejected);
   }
}

class NewPromiseThis extends Promise
{
   constructor(executor)
   {
      super((resolve, reject) =>  executor(resolve, reject));
	}
   then(onFulfilled, onRejected)
   {
		 sonsole.log( typeof this);
       return super.then(onFulfilled, onRejected);
   }
}
// Main function

async function newPromiseExperiment()
{
	let res = "foo";
   let x = new NewPromise ((resolve, reject) => 
   {
      setTimeout(() => 
      {
         resolve(res);
      }, 3000);
      console.log("salut")
   });
	//x.then(value => console.log('Valoarea este: ' + value));
	x.then(console.log);
	console.log("follows " + res);
}