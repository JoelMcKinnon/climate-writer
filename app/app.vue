<template>
  <div class="min-h-screen bg-ccl-sand50">
    <Head>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800&display=swap" rel="stylesheet">
    </Head>

    <header class="bg-white border-b">
      <div class="mx-auto max-w-5xl px-6 py-8 text-center">
        <h1 class="text-5xl font-extrabold text-ccl-blue">Climate Writer</h1>
        <p class="mt-2 text-lg text-slate-700">
          A tool for assisting climate advocates on writing letters for submittal to editors
        </p>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-6 py-8">
      <NuxtPage />
    </main>
  </div>
</template>
