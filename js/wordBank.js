/**
 * wordBank.js — the pool of words the game can pick from.
 *
 * This is pure data, kept separate from the game logic so it's easy to add,
 * remove, or tweak words without touching any code. Each entry has:
 *   w   — the word itself (lower-case; 3–9 letters)
 *   pos — its part of speech (shown as a hint and on the result card)
 *   def — a short definition
 *   use — a natural example sentence ("Use it: …")
 *
 * Curated to be uncommon-but-conversational — words worth dropping into a chat.
 */
export const WORDS = [
  { w: 'pithy',    pos: 'adjective', def: 'Brief, forceful, and full of meaning.',                 use: 'His pithy summary said in one line what the report took ten pages to explain.' },
  { w: 'laconic',  pos: 'adjective', def: 'Using very few words; terse.',                          use: 'Her laconic “fine” made it clear she was anything but.' },
  { w: 'candor',   pos: 'noun',      def: 'Honest, open, and sincere expression.',                 use: 'I appreciated his candor when he admitted the plan had flaws.' },
  { w: 'nuance',   pos: 'noun',      def: 'A subtle shade of meaning or difference.',              use: 'Good translators capture the nuance, not just the literal words.' },
  { w: 'astute',   pos: 'adjective', def: 'Sharp, perceptive, and clever.',                        use: 'That was an astute observation about why the project stalled.' },
  { w: 'sanguine', pos: 'adjective', def: 'Cheerfully optimistic, even in tough times.',           use: 'Despite the setback, she stayed sanguine about the launch.' },
  { w: 'eloquent', pos: 'adjective', def: 'Fluent and persuasive in speech or writing.',           use: 'Her eloquent toast left half the table in tears.' },
  { w: 'affable',  pos: 'adjective', def: 'Friendly, warm, and easy to talk to.',                  use: 'The new manager is so affable that people line up to chat.' },
  { w: 'cogent',   pos: 'adjective', def: 'Clear, logical, and convincing.',                       use: 'She made a cogent case for delaying the release.' },
  { w: 'lucid',    pos: 'adjective', def: 'Clear and easy to understand.',                          use: 'Thanks for the lucid explanation — it finally clicked.' },
  { w: 'prudent',  pos: 'adjective', def: 'Careful, sensible, and wise in practice.',              use: 'It is prudent to keep a backup before you deploy.' },
  { w: 'succinct', pos: 'adjective', def: 'Briefly and clearly expressed.',                        use: 'Keep the update succinct; everyone is short on time.' },
  { w: 'adept',    pos: 'adjective', def: 'Highly skilled or proficient.',                          use: 'She is remarkably adept at defusing tense meetings.' },
  { w: 'rapport',  pos: 'noun',      def: 'A relationship of mutual understanding and trust.',     use: 'They built an easy rapport within minutes.' },
  { w: 'poignant', pos: 'adjective', def: 'Deeply moving; keenly touching.',                       use: 'It was a poignant goodbye after ten years together.' },
  { w: 'earnest',  pos: 'adjective', def: 'Sincere and seriously intentioned.',                    use: 'His earnest apology smoothed everything over.' },
  { w: 'blithe',   pos: 'adjective', def: 'Carefree and cheerfully unconcerned.',                  use: 'She gave a blithe wave and carried on.' },
  { w: 'droll',    pos: 'adjective', def: 'Amusing in an odd or whimsical way.',                   use: 'He has a droll way of delivering even bad news.' },
  { w: 'canny',    pos: 'adjective', def: 'Shrewd, especially in money or business.',              use: 'A canny investor, she sold just before the dip.' },
  { w: 'banter',   pos: 'noun',      def: 'Playful, teasing conversation.',                        use: 'The interview ended with some friendly banter.' },
  { w: 'jovial',   pos: 'adjective', def: 'Cheerful and good-humored.',                            use: 'Our host was jovial and kept everyone laughing.' },
  { w: 'ardent',   pos: 'adjective', def: 'Very enthusiastic or passionate.',                      use: 'He is an ardent supporter of open-source.' },
  { w: 'cordial',  pos: 'adjective', def: 'Warm and friendly.',                                    use: 'We reached a cordial agreement over coffee.' },
  { w: 'quip',     pos: 'noun',      def: 'A witty or clever remark.',                             use: 'He lightened the mood with a quick quip.' },
  { w: 'whimsy',   pos: 'noun',      def: 'Playfully quaint or fanciful behavior.',               use: 'The design has a touch of whimsy that users love.' },
  { w: 'diligent', pos: 'adjective', def: 'Hardworking and careful.',                              use: 'A diligent reviewer caught the bug before release.' },
  { w: 'amicable', pos: 'adjective', def: 'Friendly and free of conflict.',                        use: 'They reached an amicable split with no hard feelings.' },
  { w: 'verbose',  pos: 'adjective', def: 'Using more words than needed.',                         use: 'The email was so verbose I just skimmed it.' },
  { w: 'brevity',  pos: 'noun',      def: 'Concise and exact use of words.',                       use: 'Brevity is a kindness in a long meeting.' },
  { w: 'tactful',  pos: 'adjective', def: 'Sensitive and diplomatic with people.',                use: 'A tactful nudge worked better than a blunt order.' },
  { w: 'genial',   pos: 'adjective', def: 'Pleasant, friendly, and good-natured.',                use: 'His genial manner put the nervous candidate at ease.' },
  { w: 'wry',      pos: 'adjective', def: 'Dryly and cleverly humorous.',                          use: 'She raised an eyebrow and made a wry remark.' },
  { w: 'apt',      pos: 'adjective', def: 'Strikingly appropriate or fitting.',                    use: 'That was an apt comparison — it nailed the problem.' },
  { w: 'savvy',    pos: 'noun',      def: 'Practical know-how and shrewdness.',                    use: 'Her marketing savvy doubled our reach.' },

  // ── Verbs ──
  { w: 'glean',     pos: 'verb', def: 'Gather (information) bit by bit.',                use: 'I gleaned a few useful tips from the talk.' },
  { w: 'broach',    pos: 'verb', def: 'Bring up a difficult or sensitive topic.',       use: 'She gently broached the subject of money.' },
  { w: 'bolster',   pos: 'verb', def: 'Support or strengthen.',                         use: 'These results bolster our argument.' },
  { w: 'placate',   pos: 'verb', def: 'Calm or appease someone.',                       use: 'A quick apology placated the client.' },
  { w: 'quell',     pos: 'verb', def: 'Put an end to; suppress.',                       use: 'A few calm words quelled the panic.' },
  { w: 'garner',    pos: 'verb', def: 'Gather or earn (support, praise).',              use: 'The idea garnered plenty of support.' },
  { w: 'relish',    pos: 'verb', def: 'Enjoy greatly.',                                 use: 'He relishes a good debate.' },
  { w: 'posit',     pos: 'verb', def: 'Put forward as fact or a basis for argument.',  use: 'Let me posit a simpler explanation.' },
  { w: 'elicit',    pos: 'verb', def: 'Draw out a response or reaction.',              use: 'The question elicited an awkward silence.' },
  { w: 'concede',   pos: 'verb', def: 'Admit something is true; yield.',               use: 'I will concede that you were right.' },
  { w: 'meander',   pos: 'verb', def: 'Wander or drift aimlessly.',                    use: 'The conversation meandered for an hour.' },
  { w: 'galvanize', pos: 'verb', def: 'Shock or spur into action.',                    use: 'The setback galvanized the whole team.' },
  { w: 'mull',      pos: 'verb', def: 'Think something over.',                          use: 'Give me a day to mull it over.' },
  { w: 'hone',      pos: 'verb', def: 'Sharpen or refine.',                            use: 'She honed her pitch over many rounds.' },

  // ── More nouns ──
  { w: 'aplomb',  pos: 'noun', def: 'Self-confident poise under pressure.',  use: 'She handled the tough question with aplomb.' },
  { w: 'knack',   pos: 'noun', def: 'A natural skill or talent.',            use: 'He has a knack for explaining hard ideas.' },
  { w: 'gist',    pos: 'noun', def: 'The main point or essence.',            use: 'Just give me the gist of the meeting.' },
  { w: 'crux',    pos: 'noun', def: 'The decisive or most important point.', use: 'That is the crux of the problem.' },
  { w: 'forte',   pos: 'noun', def: 'A person’s strong point.',         use: 'Public speaking is her forte.' },
  { w: 'wit',     pos: 'noun', def: 'Quick, clever humor.',                  use: 'His wit kept the whole meeting lively.' }
];
