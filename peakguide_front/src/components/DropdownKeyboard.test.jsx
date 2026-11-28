import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter,useLocation} from 'react-router-dom';
import {afterEach,expect,it,vi} from 'vitest';
import NavDropdown from './NavDropdown';
import LanguageSwitcherDropdown from './LanguageSwitcherDropdown';
import DesktopThemeSwitcher from './DesktopThemeSwitcher';

vi.mock('../hooks/useMedia',()=>({useMedia:()=>false}));
afterEach(()=>{cleanup();localStorage.clear();document.documentElement.removeAttribute('data-theme');});
const items=[{key:'peaks',label:'Peaks',href:'/peaks'},{key:'weather',label:'Weather',href:'/weather'},{key:'sep',type:'sep'},{key:'soon',label:'Trailheads',disabled:true}];
function Path(){return <output data-testid="path">{useLocation().pathname}</output>;}
function renderNav(options=items){render(<MemoryRouter><button>Before</button><NavDropdown label="More" items={options}/><button>After</button><Path/></MemoryRouter>);}

it('opens More from either arrow, includes disabled items in navigation and never activates them',async()=>{
 const user=userEvent.setup();renderNav();const trigger=screen.getByRole('button',{name:'More'});trigger.focus();
 await user.keyboard('{ArrowUp}');expect(screen.getByRole('menuitem',{name:'Trailheads'})).toHaveFocus();
 await user.keyboard('{Enter} ');expect(screen.getByTestId('path')).toHaveTextContent('/');expect(trigger).toHaveAttribute('aria-expanded','true');
 await user.keyboard('{ArrowDown}');expect(screen.getByRole('menuitem',{name:'Peaks'})).toHaveFocus();
 await user.keyboard('{End}');expect(screen.getByRole('menuitem',{name:'Trailheads'})).toHaveFocus();
 await user.keyboard('{Home}');expect(screen.getByRole('menuitem',{name:'Peaks'})).toHaveFocus();
 await user.keyboard('{Escape}');expect(trigger).toHaveFocus();expect(screen.queryByRole('menu')).toBeNull();
 await user.keyboard('{ArrowDown}{ArrowDown} ');expect(screen.getByTestId('path')).toHaveTextContent('/weather');expect(screen.queryByRole('menu')).toBeNull();
});
it('can focus and dismiss a desktop menu containing only an unavailable item',async()=>{
 const user=userEvent.setup();renderNav([items.at(-1)]);const trigger=screen.getByRole('button',{name:'More'});trigger.focus();
 await user.keyboard('{ArrowDown}');expect(screen.getByRole('menuitem',{name:'Trailheads'})).toHaveFocus();
 await user.keyboard('{Escape}');expect(trigger).toHaveFocus();expect(screen.queryByRole('menu')).toBeNull();
});
// Native focus movement after keydown is covered by Playwright: user-event
// computes its Tab destination from the pre-event popup item, unlike browsers.
it.each([false,true])('Tab closes More and anchors native navigation at the trigger (reverse=%s)',async reverse=>{
 const user=userEvent.setup();renderNav();await user.click(screen.getByRole('button',{name:'More'}));await user.keyboard('{ArrowDown}');
 fireEvent.keyDown(document.activeElement,{key:'Tab',shiftKey:reverse});expect(screen.queryByRole('menu')).toBeNull();expect(screen.getByRole('button',{name:'More'})).toHaveFocus();
});
it('closes on external focus without taking that focus back',async()=>{
 const user=userEvent.setup();renderNav();await user.click(screen.getByRole('button',{name:'More'}));act(()=>screen.getByRole('button',{name:'After'}).focus());
 expect(screen.queryByRole('menu')).toBeNull();expect(screen.getByRole('button',{name:'After'})).toHaveFocus();
});
for(const kind of ['language','theme']){
 function renderChoice(){
  localStorage.setItem('ui_theme_mode','dark');
  render(<><button>Before</button>{kind==='language'?<LanguageSwitcherDropdown lang="en" setLang={()=>{}}/>:<DesktopThemeSwitcher lang="en"/>}<button>After</button></>);
  return screen.getByRole('button',{name:kind==='language'?'Language: EN English':'Theme: Dark'});
 }
 it(`${kind}: opens at the selected value rather than the first option`,async()=>{
  const user=userEvent.setup(),trigger=renderChoice();trigger.focus();await user.keyboard('{ArrowDown}');
  expect(screen.getByRole('option',{selected:true})).toHaveFocus();await user.keyboard('{Escape}');expect(trigger).toHaveFocus();expect(screen.queryByRole('listbox')).toBeNull();
 });
 it.each([false,true])(`${kind}: Tab closes and anchors native navigation at the trigger (reverse=%s)`,async reverse=>{
  const user=userEvent.setup(),trigger=renderChoice();await user.click(trigger);fireEvent.keyDown(document.activeElement,{key:'Tab',shiftKey:reverse});
  expect(screen.queryByRole('listbox')).toBeNull();expect(trigger).toHaveFocus();
 });
}
