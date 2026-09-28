/* ============================================================
   타이핑 마스터 — 단어 데이터베이스
   형식: "단어|뜻"   (뜻을 생략하면 단어만 표시)
   초보자용이므로 모두 소문자/기본형 위주로 구성
   ============================================================ */
(function () {
  'use strict';

  var RAW = {

    computer: {
      name: '컴퓨터 용어', icon: '💻', desc: 'PC·인터넷 기초 단어', words: [
        'file|파일', 'copy|복사하다', 'save|저장하다', 'mouse|마우스', 'click|클릭하다',
        'icon|아이콘', 'menu|메뉴', 'zoom|확대하다', 'edit|편집하다', 'undo|되돌리다',
        'folder|폴더', 'delete|삭제하다', 'cursor|커서', 'screen|화면', 'laptop|노트북',
        'update|갱신하다', 'server|서버', 'cable|케이블', 'battery|배터리', 'speaker|스피커',
        'camera|카메라', 'charger|충전기', 'printer|프린터', 'desktop|바탕화면', 'network|네트워크',
        'browser|브라우저', 'website|웹사이트', 'internet|인터넷', 'download|내려받기', 'password|비밀번호',
        'backup|백업', 'storage|저장 공간', 'install|설치하다', 'refresh|새로 고침', 'scanner|스캐너',
        'keyboard|키보드', 'monitor|모니터', 'program|프로그램', 'software|소프트웨어', 'hardware|하드웨어',
        'shutdown|종료', 'settings|설정', 'document|문서', 'shortcut|바로 가기', 'clipboard|클립보드'
      ]
    },

    ai: {
      name: 'AI 용어', icon: '🤖', desc: '인공지능·챗봇 시대 필수 단어', words: [
        'data|자료', 'bias|편향', 'loss|손실', 'epoch|에포크', 'agent|에이전트',
        'token|토큰', 'model|모델', 'label|꼬리표', 'sample|표본', 'reward|보상',
        'policy|정책', 'vector|벡터', 'matrix|행렬', 'cluster|군집', 'prompt|프롬프트',
        'dataset|데이터셋', 'feature|특징', 'neural|신경의', 'context|문맥', 'robotics|로봇공학',
        'training|학습', 'learning|학습', 'deep|깊은', 'vision|시각', 'chatbot|챗봇',
        'machine|기계', 'accuracy|정확도', 'predict|예측하다', 'generate|생성하다', 'classify|분류하다',
        'attention|주의', 'parameter|매개변수', 'algorithm|알고리즘', 'embedding|임베딩', 'inference|추론',
        'anomaly|이상', 'artificial|인공의', 'autonomous|자율적인', 'intelligence|지능', 'transformer|변환기',
        'hallucination|환각', 'alignment|정렬', 'supervised|지도된', 'reinforcement|강화'
      ]
    },

    daily: {
      name: '실생활 용어', icon: '🏠', desc: '매일 쓰는 생활 단어', words: [
        /* 짧은 단어(초급 레벨용) */
        'bus|버스', 'car|자동차', 'key|열쇠', 'bag|가방', 'cup|컵',
        'tea|차', 'milk|우유', 'rice|밥', 'salt|소금', 'door|문',
        'desk|책상', 'lamp|스탠드', 'soap|비누', 'mail|우편', 'cash|현금',
        'card|카드', 'coat|코트', 'shoe|신발', 'road|도로', 'park|공원',
        'taxi|택시', 'gift|선물', 'note|메모', 'plan|계획', 'rest|휴식',
        'wash|씻다', 'cook|요리하다', 'bank|은행', 'food|음식', 'hour|시간',
        'moon|달', 'star|별', 'wind|바람', 'fire|불', 'shop|가게',
        'home|집', 'work|일', 'week|주', 'rain|비', 'snow|눈',
        /* 조금 긴 단어 */
        'hello|안녕', 'sorry|미안', 'thanks|고마워', 'please|부디', 'ticket|표',
        'wallet|지갑', 'market|시장', 'coffee|커피', 'weather|날씨', 'morning|아침',
        'evening|저녁', 'weekend|주말', 'laundry|빨래', 'umbrella|우산', 'subway|지하철',
        'hospital|병원', 'pharmacy|약국', 'receipt|영수증', 'discount|할인', 'delivery|배달',
        'package|소포', 'garbage|쓰레기', 'parking|주차', 'traffic|교통', 'schedule|일정',
        'grocery|식료품', 'appointment|약속', 'elevator|엘리베이터', 'apartment|아파트', 'neighbor|이웃',
        'library|도서관', 'breakfast|아침 식사', 'tomorrow|내일', 'yesterday|어제', 'sometimes|가끔',
        'together|함께', 'shower|샤워', 'monthly|매달의', 'careful|조심스러운', 'borrow|빌리다'
      ]
    },

    food: {
      name: '음식', icon: '🍎', desc: '먹거리와 요리 단어', words: [
        'apple|사과', 'bread|빵', 'honey|꿀', 'juice|주스', 'lemon|레몬',
        'onion|양파', 'pizza|피자', 'salad|샐러드', 'soup|수프', 'sugar|설탕',
        'grape|포도', 'mango|망고', 'lunch|점심', 'kitchen|부엌', 'flavor|맛',
        'banana|바나나', 'cheese|치즈', 'cookie|쿠키', 'dinner|저녁 식사', 'garlic|마늘',
        'noodle|국수', 'pepper|후추', 'tomato|토마토', 'yogurt|요구르트', 'butter|버터',
        'carrot|당근', 'cereal|시리얼', 'dessert|디저트', 'dumpling|만두', 'mushroom|버섯',
        'orange|오렌지', 'peanut|땅콩', 'potato|감자', 'recipe|조리법', 'salmon|연어',
        'seafood|해산물', 'spinach|시금치', 'vinegar|식초', 'walnut|호두', 'chicken|닭고기',
        'sandwich|샌드위치', 'strawberry|딸기', 'vegetable|채소', 'watermelon|수박'
      ]
    },

    people: {
      name: '사람 · 직업', icon: '👤', desc: '사람과 직업 이름', words: [
        'doctor|의사', 'artist|예술가', 'driver|운전사', 'farmer|농부', 'lawyer|변호사',
        'nurse|간호사', 'pilot|조종사', 'singer|가수', 'waiter|종업원', 'cousin|사촌',
        'parent|부모', 'uncle|삼촌', 'aunt|이모', 'wife|아내', 'guest|손님',
        'chef|요리사', 'clerk|점원', 'coach|지도자', 'guard|경비원', 'guide|안내자',
        'author|저자', 'baker|제빵사', 'soldier|군인', 'captain|선장', 'dentist|치과의사',
        'teacher|선생님', 'student|학생', 'engineer|기술자', 'manager|관리자', 'customer|손님',
        'neighbor|이웃', 'husband|남편', 'brother|형제', 'sister|자매', 'nephew|조카',
        'passenger|승객', 'scientist|과학자', 'translator|번역가', 'volunteer|자원봉사자', 'colleague|동료'
      ]
    },

    verb: {
      name: '동사', icon: '🏃', desc: '가장 많이 쓰는 기본 동사', words: [
        'run|달리다', 'walk|걷다', 'know|알다', 'take|가져가다', 'give|주다',
        'make|만들다', 'come|오다', 'look|보다', 'want|원하다', 'find|찾다',
        'tell|말하다', 'ask|묻다', 'work|일하다', 'feel|느끼다', 'try|시도하다',
        'call|부르다', 'need|필요로 하다', 'become|되다', 'begin|시작하다', 'bring|가져오다',
        'buy|사다', 'change|바꾸다', 'choose|고르다', 'decide|결정하다', 'follow|따르다',
        'forget|잊다', 'happen|일어나다', 'help|돕다', 'learn|배우다', 'listen|듣다',
        'meet|만나다', 'open|열다', 'play|놀다', 'read|읽다', 'send|보내다',
        'show|보여주다', 'speak|말하다', 'study|공부하다', 'teach|가르치다', 'wait|기다리다',
        'write|쓰다', 'think|생각하다', 'understand|이해하다', 'remember|기억하다', 'explain|설명하다'
      ]
    },

    noun: {
      name: '명사', icon: '📦', desc: '일상 필수 명사', words: [
        'time|시간', 'year|해', 'day|날', 'life|삶', 'hand|손',
        'part|부분', 'week|주', 'case|경우', 'home|집', 'room|방',
        'book|책', 'word|단어', 'job|직업', 'idea|생각', 'money|돈',
        'water|물', 'night|밤', 'point|점', 'world|세계', 'child|아이',
        'thing|것', 'place|장소', 'school|학교', 'family|가족', 'group|무리',
        'country|나라', 'problem|문제', 'question|질문', 'number|숫자', 'system|체계',
        'company|회사', 'friend|친구', 'story|이야기', 'month|달', 'father|아버지',
        'mother|어머니', 'business|사업', 'service|봉사', 'government|정부', 'people|사람들'
      ]
    },

    conjunction: {
      name: '접속사 · 연결어', icon: '🔗', desc: '문장을 이어 주는 말', words: [
        'and|그리고', 'but|그러나', 'or|또는', 'so|그래서', 'if|만약',
        'yet|아직', 'nor|~도 아니다', 'once|일단', 'plus|더하기', 'than|~보다',
        'when|~할 때', 'while|~하는 동안', 'since|~ 이래로', 'until|~까지', 'before|~ 전에',
        'after|~ 후에', 'though|비록', 'because|왜냐하면', 'however|그렇지만', 'whether|~인지 아닌지',
        'although|비록 ~지만', 'therefore|그러므로', 'moreover|게다가', 'otherwise|그렇지 않으면', 'whereas|반면에',
        'besides|게다가', 'meanwhile|한편', 'accordingly|그에 따라', 'nevertheless|그럼에도', 'consequently|결과적으로',
        'both|둘 다', 'either|어느 하나', 'neither|둘 다 아닌', 'unless|~하지 않으면', 'thus|이렇게'
      ]
    },

    idiom: {
      name: '숙어 · 관용표현', icon: '💬', desc: '두 단어 이상 묶음 표현', words: [
        'give up|포기하다', 'put off|미루다', 'show up|나타나다', 'work out|운동하다', 'find out|알아내다',
        'set up|설치하다', 'carry on|계속하다', 'turn down|거절하다', 'hang out|어울려 놀다', 'run out of|다 써버리다',
        'take care of|돌보다', 'look forward to|기대하다', 'come up with|생각해내다', 'figure out|알아내다', 'point out|지적하다',
        'get along with|사이좋게 지내다', 'make up your mind|마음을 정하다', 'take your time|천천히 하다', 'keep an eye on|지켜보다', 'in the long run|장기적으로',
        'a piece of cake|식은 죽 먹기', 'break the ice|어색함을 깨다', 'hit the books|공부를 시작하다', 'under the weather|몸이 안 좋은', 'get cold feet|겁이 나다',
        'call it a day|오늘은 이만 끝내다', 'on the same page|같은 생각인', 'bite the bullet|이를 악물고 하다', 'once in a blue moon|아주 드물게', 'pull someone\'s leg|놀리다'
      ]
    },

    sentence: {
      name: '문장 연습', icon: '✍️', desc: '긴 문장 · 속담 (문장 모드 전용)', words: [
        'Practice makes perfect|연습이 완벽을 만든다',
        'I love learning English every day|나는 매일 영어 배우기를 좋아한다',
        'Please type slowly and accurately|천천히 정확하게 입력하세요',
        'The quick brown fox jumps over the lazy dog|모든 알파벳이 들어간 문장',
        'Reading books opens your mind|독서는 마음을 열어 준다',
        'Where there is a will there is a way|뜻이 있는 곳에 길이 있다',
        'A journey of a thousand miles begins with a single step|천 리 길도 한 걸음부터',
        'Actions speak louder than words|행동이 말보다 크다',
        'Time flies when you are having fun|즐거우면 시간이 빨리 간다',
        'Better late than never|늦더라도 안 하는 것보다 낫다',
        'Keep your fingers on the home row|손가락을 기준 위치에 두세요',
        'Do not look at the keyboard while typing|타이핑할 때 키보드를 보지 마세요',
        'Slow and steady wins the race|느리더라도 꾸준한 사람이 이긴다',
        'Every cloud has a silver lining|어둠 속에도 희망은 있다',
        'Knowledge is power|아는 것이 힘이다'
      ]
    }
  };

  /* "단어|뜻" 문자열을 객체로 변환 */
  function parse(str) {
    var i = str.indexOf('|');
    var text = (i === -1 ? str : str.slice(0, i)).trim();
    var meaning = i === -1 ? '' : str.slice(i + 1).trim();
    return { text: text, meaning: meaning, len: text.length };
  }

  var DATA = {};
  Object.keys(RAW).forEach(function (id) {
    DATA[id] = {
      id: id,
      name: RAW[id].name,
      icon: RAW[id].icon,
      desc: RAW[id].desc,
      words: RAW[id].words.map(parse)
    };
  });

  window.WORD_DATA = DATA;
  window.parseWordEntry = parse;
})();
