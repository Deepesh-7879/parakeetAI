const menu = document.querySelector('#menu');
const nav = document.querySelector('#nav');
menu.addEventListener('click', () => {
 const expanded = menu.getAttribute('aria-expanded') !== 'true';
 menu.setAttribute('aria-expanded', String(expanded));
 nav.classList.toggle('open', expanded);
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }));
const examples = {
 intro: ['Tell me about yourself.', ['Present.', 'Start with your current role and what you love doing.'], ['Past.', 'Connect a relevant experience to a meaningful result.'], ['Future.', 'Share why this role feels like the right next chapter.']],
 challenge: ['Describe a difficult challenge you overcame.', ['Set the scene.', 'Describe a specific obstacle and why it mattered.'], ['Show your approach.', 'Explain the steps you personally took and how you worked with others.'], ['Share the result.', 'Highlight a measurable outcome and what you learned.']],
 why: ['Why should we hire you?', ['Connect.', 'Match a requirement of the role to a strength you can demonstrate.'], ['Show evidence.', 'Share a brief example of that strength making a difference.'], ['Look ahead.', 'Explain how you would bring that value to the team.']]
};
document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => {
 document.querySelectorAll('[data-question]').forEach(b => {b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button));});
 const [question, ...points] = examples[button.dataset.question];
 document.querySelector('#demo-question').textContent = `“${question}”`;
 document.querySelector('#demo-answer').replaceChildren(...points.map(([title, copy]) => {const p = document.createElement('p'); const strong = document.createElement('strong'); strong.textContent = title; p.append(strong, ` ${copy}`); return p;}));
}));
document.querySelector('#year').textContent = new Date().getFullYear();
