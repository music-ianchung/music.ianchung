# 잠시, 음악 · The Listening Room

Ian Chung 사이트 안에서 음악을 듣고 잠시 쉬어가는 몰입형 음악실입니다.

- `/listening-room/` 또는 `?hall=chamber`: 피아니스트가 있는 작은 체임버홀
- `?hall=vineyard`: 촛불과 오케스트라가 있는 빈야드홀
- 캐릭터 이동, 좌석 선택, 내 촛불 놓기, 쉬는 자리, 숨 고르기, 감상 마치기
- Web Audio로 합성한 기본 피아노 스케치와 빗소리
- YouTube 공식 플레이어, 직접 음원 URL, 로컬 MP3/WAV 재생

## 실행과 배포

빌드나 패키지 설치가 필요 없는 HTML/CSS/JavaScript 앱입니다. 저장소 루트에서 정적 HTTP 서버를 실행하고 `/listening-room/`을 열면 됩니다. GitHub Pages는 이 폴더를 그대로 제공합니다. 기본 음악은 입장 또는 재생 버튼을 누른 뒤 시작됩니다.

공간은 Canvas 2D에 직접 투영하는 3D 렌더러입니다. `space.js`와 `orchestra.js`가 각각 홀을 그리고, `venue.js`가 URL에 맞는 홀을 불러옵니다. 음악은 `audio.js`, 외부 음원은 `media.js`, 휴식 활동은 `rituals.js`와 `stillness.js`에서 처리합니다.

촛불 위치는 브라우저에 약 20분 보관되며 다른 방문자와 공유되지 않습니다. 로컬 음원 파일은 서버에 업로드되지 않습니다. YouTube를 연결하면 공식 영상 플레이어가 표시되며, 영상의 임베드 허용 여부에 따라 재생이 제한될 수 있습니다. 외부 음원 URL은 해당 서버의 접근 정책에 영향을 받습니다.

왼쪽 위 '잠시, 음악'을 누르면 이언정 사이트 홈으로 돌아갑니다.
