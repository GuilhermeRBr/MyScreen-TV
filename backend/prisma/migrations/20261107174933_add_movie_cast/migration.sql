-- CreateTable
CREATE TABLE "movie_casts" (
    "id" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "castId" TEXT NOT NULL,
    "character" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "movie_casts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "movie_casts_movieId_castId_key" ON "movie_casts"("movieId", "castId");

-- AddForeignKey
ALTER TABLE "movie_casts" ADD CONSTRAINT "movie_casts_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_casts" ADD CONSTRAINT "movie_casts_castId_fkey" FOREIGN KEY ("castId") REFERENCES "casts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
