import {act,renderHook,waitFor} from '@testing-library/react';
import {expect,it,vi} from 'vitest';
import {useWeatherResource} from './useWeatherResource';
it('aborts old transport and ignores late results after selecting another place',async()=>{
 let resolveOld,oldSignal;const old=vi.fn(signal=>{oldSignal=signal;return new Promise(resolve=>{resolveOld=resolve;});});
 const next=vi.fn(()=>Promise.resolve('new place'));
 const hook=renderHook(({id,load})=>useWeatherResource(id,load),{initialProps:{id:'old',load:old}});
 hook.rerender({id:'new',load:next});expect(oldSignal.aborted).toBe(true);
 await waitFor(()=>expect(hook.result.current).toMatchObject({status:'success',data:'new place'}));
 await act(async()=>resolveOld('old place'));expect(hook.result.current.data).toBe('new place');
 hook.rerender({id:'',load:next});expect(hook.result.current.status).toBe('idle');hook.unmount();
});
it('cleans up transport on unmount and turns timeouts into a retryable error',async()=>{
 vi.useFakeTimers();let signal;
 const load=s=>{signal=s;return new Promise((resolve,reject)=>s.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))));};
 const hook=renderHook(()=>useWeatherResource('place',load));
 await act(async()=>vi.advanceTimersByTimeAsync(12000));expect(hook.result.current).toMatchObject({status:'error',error:'unavailable'});expect(signal.aborted).toBe(true);hook.unmount();vi.useRealTimers();
});
