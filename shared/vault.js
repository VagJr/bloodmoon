// Treasury is an alternate location for existing Marcas, never a currency faucet.
export function transferVault(profile,{direction,amount,version},now=Date.now()){
 if(!['deposit','withdraw'].includes(direction)||!Number.isSafeInteger(amount)||amount<=0)throw new Error('Escolha uma quantidade inteira maior que zero.');
 const vault=profile.vault||{balance:0,version:0,history:[]};
 if(version!==vault.version)throw new Error('Seu saldo mudou. Reabra o cofre antes de confirmar.');
 const purse=profile.coins||0,balance=vault.balance||0;
 if(direction==='deposit'&&amount>purse)throw new Error('Sua bolsa não tem Marcas suficientes.');
 if(direction==='withdraw'&&amount>balance)throw new Error('Seu cofre não tem Marcas suficientes.');
 const coins=purse+(direction==='deposit'?-amount:amount),next=balance+(direction==='deposit'?amount:-amount);
 if(!Number.isSafeInteger(coins)||!Number.isSafeInteger(next)||coins<0||next<0)throw new Error('O valor excede o limite do cofre.');
 profile.coins=coins;profile.vault={balance:next,version:vault.version+1,history:[{direction,amount,at:now},...(vault.history||[])].slice(0,20)};
 return profile.vault;
}
