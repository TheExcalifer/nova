const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const { CronJob } = require('cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(express.static(path.join((__dirname, 'public'))));

app.use(bodyParser.json());

// ? Cron Job, executing every 1 minute
new CronJob('* * * * *', async () => {
  const updateProductWithoutBids = await prisma.product.updateMany({
    where: {
      Bids: {
        none: { active: true },
      },
      expireTime: { lt: new Date() },
    },
    data: {
      expireTime: null,
    },
  });

  const productsWithBids = await prisma.product.findMany({
    include: {
      Bids: { orderBy: { bidAmount: 'desc' } },
    },
    where: {
      expireTime: {
        lt: new Date(),
      },
      Bids: {
        some: { active: true },
      },
    },
  });

  if (productsWithBids.length == 0) return;
  
  // Pay royality to creator
  productsWithBids.forEach(async (product) => {
    // user with highest bid amount
    const buyer = product.Bids[0];
    const royalityAmount = (product.royality * buyer.bidAmount) / 100;

    // Paying Royality
    const payingRoyalityToCreator = await prisma.user.update({
      where: { id: product.creatorId },
      data: {
        balance: { increment: royalityAmount },
      },
    });

    // Transfer money from buyer to seller

    const updateSellerBalance = await prisma.user.update({
      where: { id: product.ownerId },
      data: { balance: { increment: buyer.bidAmount - royalityAmount } },
    });
    const updateBuyerBalance = await prisma.user.update({
      where: { id: buyer.userId },
      data: { balance: { decrement: buyer.bidAmount } },
    });

    // Change Product Owner
    const changeOwner = await prisma.product.update({ where: { id: product.id }, data: { ownerId: buyer.userId } });

    // Inactivate Bids & product
    await prisma.product.update({ where: { id: product.id }, data: { expireTime: null } });
    await prisma.bids.updateMany({ where: { productId: product.id }, data: { active: false } });
  });
}).start();

// routes
const nuronRoutes = require('./routes/nuron');
const userRoutes = require('./routes/user');

app.use('/user', userRoutes);

app.use('/', nuronRoutes);

app.listen(3000);
