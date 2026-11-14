import {act, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, expect, it, vi} from 'vitest';
import PeaksToolbar from './PeaksToolbar';
import {useState} from 'react';
afterEach(()=>vi.useRealTimers());
it('clearing all filters cancels a pending search without restoring the old collection',()=>{
 vi.useFakeTimers();
 const changes=vi.fn();
 function Harness(){
  const [params,setParams]=useState({q:'Ben ',collection:'three-peaks'});
  return <PeaksToolbar {...params} lang="en" country="all" range="all" sort="elev_desc" ranges={[]} countries={[]}
   setQ={q=>{changes(q);setParams({...params,q});}}
   resetFilters={()=>setParams({q:'',collection:'all'})}/>;
 }
 render(<Harness/>);
 fireEvent.change(screen.getByRole('textbox',{name:'Search'}),{target:{value:'Ben Nevis'}});
 act(()=>vi.advanceTimersByTime(290));
 fireEvent.click(screen.getByRole('button',{name:'Clear all filters'}));
 act(()=>vi.advanceTimersByTime(1000));
 expect(screen.getByRole('combobox',{name:'Collection'})).toHaveValue('all');
 expect(screen.getByRole('textbox',{name:'Search'})).toHaveValue('');
 expect(changes).not.toHaveBeenCalled();
});
