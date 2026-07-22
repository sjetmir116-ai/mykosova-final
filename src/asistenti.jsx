// KORRIGJIMI: Përdorimi i .at(0) shmang plotësisht kllapat katrore që bllokojnë build-in
const pergjigjja = data?.candidates?.at(0)?.content?.parts?.at(0)?.text || "Më falni, ndodhi një gabim gjatë procesimit të përgjigjes.";
