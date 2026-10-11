export type Entry = {id:string; title:string; organization:string; location:string; start:string; end:string; current:boolean; details:string};
export type Resume = {version:1; contact:{name:string; title:string; email:string; phone:string; location:string; links:string}; summary:string; experience:Entry[]; education:Entry[]; skills:string; certifications:string; paper:'A4'|'LETTER'};
export const uid = () => crypto.randomUUID();
export const entry = ():Entry => ({id:uid(),title:'',organization:'',location:'',start:'',end:'',current:false,details:''});
export const blank = ():Resume => ({version:1,contact:{name:'',title:'',email:'',phone:'',location:'',links:''},summary:'',experience:[],education:[],skills:'',certifications:'',paper:'A4'});
export const sample = ():Resume => ({...blank(), contact:{name:'Alex Rivera',title:'Operations Coordinator',email:'alex.rivera@example.com',phone:'+63 917 000 1234',location:'Quezon City, Philippines',links:'linkedin.com/in/alex-rivera'},summary:'Operations coordinator with three years of experience in reporting, records management, and team support. Builds clear tracking systems and improves day-to-day workflows with Google Sheets and practical automation.',experience:[{...entry(),title:'Operations Coordinator',organization:'Northline Services',location:'Quezon City',start:'2024-01',end:'',current:true,details:'Maintained a tracking system for 200 monthly requests, reducing missed follow-ups by 30%.\nBuilt weekly reports in Google Sheets to help a five-person team prioritize overdue tasks.\nCoordinated schedules and records across three departments.'},{...entry(),title:'Administrative Assistant',organization:'Civic Support Center',location:'Manila',start:'2023-01',end:'2023-12',current:false,details:'Organized 1,500 digital records using consistent naming and access controls.\nPrepared meeting notes and tracked action items for the operations team.'}],education:[{...entry(),title:'Bachelor of Science in Business Administration',organization:'Metro City College',location:'Manila',start:'2018-08',end:'2022-06',current:false,details:'Relevant coursework: business analytics, project management, and operations.'}],skills:'Google Sheets, Microsoft Excel, Records Management, Data Cleaning, Report Writing, Scheduling',certifications:'Google Project Management Certificate, Coursera, 2023'});
const fields=['title','organization','location','start','end','details'];
export function parseResume(raw:unknown):Resume {
 if(!raw || typeof raw!=='object') throw new Error('Choose a Folio JSON backup.');
 const r=raw as Record<string,any>;
 if(r.version!==1 || !r.contact || typeof r.contact!=='object' || !['A4','LETTER'].includes(r.paper)) throw new Error('This backup format is not supported.');
 const text=(x:unknown)=> {if(typeof x!=='string' || x.length>20000) throw new Error('The backup contains invalid or very long text.');return x;};
 const result=blank();
 for(const key of Object.keys(result.contact) as (keyof Resume['contact'])[]) result.contact[key]=text(r.contact[key]);
 for(const key of ['summary','skills','certifications'] as const) result[key]=text(r[key]);
 for(const key of ['experience','education'] as const){if(!Array.isArray(r[key])||r[key].length>100)throw new Error('Invalid resume entries.');result[key]=r[key].map((e:any)=>{if(!e||typeof e!=='object'||typeof e.current!=='boolean')throw new Error('Invalid entry.');const out=entry(); for(const f of fields) (out as any)[f]=text(e[f]);if(![out.start,out.end].every(d=>d===''||/^\d{4}-(0[1-9]|1[0-2])$/.test(d)))throw new Error('Invalid dates in backup.');out.current=e.current;return out;});}
 result.paper=r.paper;return result;
}
export const lines=(s:string)=>s.split(/\r?\n/).map(l=>l.trim().replace(/^[-•]\s*/, '')).filter(Boolean);
export const month=(s:string)=>{if(!s)return '';const [y,m]=s.split('-');return `${['January','February','March','April','May','June','July','August','September','October','November','December'][Number(m)-1]} ${y}`;};
export const dates=(e:Entry)=>[month(e.start),e.current?'Present':month(e.end)].filter(Boolean).join(' - ');
export const nonempty=(e:Entry)=>!![e.title,e.organization,e.location,e.start,e.end,e.details].some(s=>s.trim());
export type Block={text:string;kind:'name'|'title'|'contact'|'heading'|'role'|'meta'|'body'|'bullet'};
export function blocks(r:Resume):Block[]{
 const b:Block[]=[];const add=(text:string,kind:Block['kind'])=>{if(text.trim()) b.push({text:text.trim(),kind});};
 add(r.contact.name,'name');add(r.contact.title,'title');add([r.contact.email,r.contact.phone,r.contact.location].filter(Boolean).join(' | '),'contact');lines(r.contact.links).forEach(t=>add(t,'contact'));
 if(r.summary.trim()){add('Summary','heading');add(r.summary,'body');}
 for(const section of ['experience','education'] as const){const entries=r[section].filter(nonempty);if(entries.length){add(section==='experience'?'Experience':'Education','heading');entries.forEach(e=>{add(e.title,'role');add([e.organization,e.location,dates(e)].filter(Boolean).join(' | '),'meta');lines(e.details).forEach(t=>add(t,section==='experience'?'bullet':'body'));});}}
 if(r.skills.trim()){add('Skills','heading');add(r.skills,'body');}
 if(r.certifications.trim()){add('Certifications','heading');lines(r.certifications).forEach(t=>add(t,'body'));}return b;
}
export const filename=(r:Resume)=>`${r.contact.name.trim().replace(/[^\p{L}\p{N}-]+/gu,'-').replace(/^-|-$/g,'') || 'My'}-Resume`;
