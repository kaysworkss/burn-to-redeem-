export const contractCode = [
  {
    "prim": "storage",
    "args": [
      {
        "prim": "pair",
        "args": [
          { "prim": "bool", "annots": ["%active"] },
          {
            "prim": "pair",
            "args": [
              { "prim": "address", "annots": ["%admin"] },
              {
                "prim": "pair",
                "args": [
                  { "prim": "nat", "annots": ["%burn_amount"] },
                  {
                    "prim": "pair",
                    "args": [
                      { "prim": "address", "annots": ["%burn_token_address"] },
                      {
                        "prim": "pair",
                        "args": [
                          { "prim": "nat", "annots": ["%burn_token_id"] },
                          {
                            "prim": "pair",
                            "args": [
                              {
                                "prim": "option",
                                "args": [{ "prim": "timestamp" }],
                                "annots": ["%end_timestamp"]
                              },
                              {
                                "prim": "pair",
                                "args": [
                                  { "prim": "nat", "annots": ["%reward_amount"] },
                                  {
                                    "prim": "pair",
                                    "args": [
                                      {
                                        "prim": "address",
                                        "annots": ["%reward_token_address"]
                                      },
                                      {
                                        "prim": "pair",
                                        "args": [
                                          {
                                            "prim": "nat",
                                            "annots": ["%reward_token_id"]
                                          },
                                          {
                                            "prim": "nat",
                                            "annots": ["%total_redeemed"]
                                          }
                                        ]
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "prim": "parameter",
    "args": [
      {
        "prim": "or",
        "args": [
          {
            "prim": "or",
            "args": [
              {
                "prim": "or",
                "args": [
                  { "prim": "unit", "annots": ["%redeem"] },
                  { "prim": "bool", "annots": ["%set_active"] }
                ]
              },
              {
                "prim": "or",
                "args": [
                  { "prim": "nat", "annots": ["%set_burn_amount"] },
                  {
                    "prim": "pair",
                    "args": [
                      { "prim": "address", "annots": ["%address"] },
                      {
                        "prim": "pair",
                        "args": [
                          { "prim": "nat", "annots": ["%amount"] },
                          { "prim": "nat", "annots": ["%token_id"] }
                        ]
                      }
                    ],
                    "annots": ["%set_burn_token"]
                  }
                ]
              }
            ]
          },
          {
            "prim": "or",
            "args": [
              {
                "prim": "or",
                "args": [
                  {
                    "prim": "option",
                    "args": [{ "prim": "timestamp" }],
                    "annots": ["%set_duration"]
                  },
                  { "prim": "nat", "annots": ["%set_reward_amount"] }
                ]
              },
              {
                "prim": "or",
                "args": [
                  {
                    "prim": "pair",
                    "args": [
                      { "prim": "address", "annots": ["%address"] },
                      {
                        "prim": "pair",
                        "args": [
                          { "prim": "nat", "annots": ["%amount"] },
                          { "prim": "nat", "annots": ["%token_id"] }
                        ]
                      }
                    ],
                    "annots": ["%set_reward_token"]
                  },
                  {
                    "prim": "or",
                    "args": [
                      { "prim": "address", "annots": ["%update_admin"] },
                      { "prim": "nat", "annots": ["%withdraw_rewards"] }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "prim": "code",
    "args": [
      [
        { "prim": "CAST", "args": [{ "prim": "pair", "args": [{ "prim": "or" }, { "prim": "pair" }] }] },
        { "prim": "UNPAIR" },
        {
          "prim": "IF_LEFT",
          "args": [
            [
              {
                "prim": "IF_LEFT",
                "args": [
                  [
                    {
                      "prim": "IF_LEFT",
                      "args": [
                        [
                          { "prim": "DROP" },
                          { "prim": "DUP" },
                          { "prim": "GET", "args": [{ "int": 1 }] },
                          { "prim": "IF", "args": [[], [{ "prim": "PUSH", "args": [{ "prim": "string" }, { "string": "PAUSED" }] }, { "prim": "FAILWITH" }]] },
                          { "prim": "DUP" },
                          { "prim": "GET", "args": [{ "int": 11 }] },
                          { "prim": "IF_NONE", "args": [[], [{ "prim": "NOW" }, { "prim": "COMPARE" }, { "prim": "LT" }, { "prim": "IF", "args": [[], [{ "prim": "PUSH", "args": [{ "prim": "string" }, { "string": "EXPIRED" }] }, { "prim": "FAILWITH" }]] }]] },
                          { "prim": "NIL", "args": [{ "prim": "operation" }] },
                          { "prim": "DUP", "args": [{ "int": 2 }] },
                          { "prim": "GET", "args": [{ "int": 7 }] },
                          { "prim": "CONTRACT", "args": [{ "prim": "list", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "list", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "pair", "args": [{ "prim": "nat" }, { "int": 0 }] }] }] }] }] }] },
                          { "prim": "IF_NONE", "args": [[{ "prim": "PUSH", "args": [{ "prim": "string" }, { "string": "BURN_TOKEN_INVALID" }] }, { "prim": "FAILWITH" }], []] },
                          { "prim": "PUSH", "args": [{ "prim": "mutez" }, { "int": 0 }] },
                          { "prim": "NIL", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "pair", "args": [{ "prim": "nat" }, { "int": 0 }] }] }] },
                          { "prim": "PUSH", "args": [{ "prim": "address" }, { "string": "tz1burnburnburnburnburnburnburj5ig6f" }] },
                          { "prim": "DUP", "args": [{ "int": 5 }] },
                          { "prim": "GET", "args": [{ "int": 9 }] },
                          { "prim": "DUP", "args": [{ "int": 6 }] },
                          { "prim": "GET", "args": [{ "int": 5 }] },
                          { "prim": "PAIR" },
                          { "prim": "PAIR" },
                          { "prim": "CONS" },
                          { "prim": "SENDER" },
                          { "prim": "PAIR" },
                          { "prim": "NIL", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "list", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "pair", "args": [{ "prim": "nat" }, { "int": 0 }] }] }] }] }] },
                          { "prim": "SWAP" },
                          { "prim": "CONS" },
                          { "prim": "TRANSFER_TOKENS" },
                          { "prim": "CONS" },
                          { "prim": "DUP", "args": [{ "int": 2 }] },
                          { "prim": "GET", "args": [{ "int": 15 }] },
                          { "prim": "CONTRACT", "args": [{ "prim": "list", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "list", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "pair", "args": [{ "prim": "nat" }, { "int": 0 }] }] }] }] }] }] },
                          { "prim": "IF_NONE", "args": [[{ "prim": "PUSH", "args": [{ "prim": "string" }, { "string": "REWARD_TOKEN_INVALID" }] }, { "prim": "FAILWITH" }], []] },
                          { "prim": "PUSH", "args": [{ "prim": "mutez" }, { "int": 0 }] },
                          { "prim": "NIL", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "pair", "args": [{ "prim": "nat" }, { "int": 0 }] }] }] },
                          { "prim": "SENDER" },
                          { "prim": "DUP", "args": [{ "int": 5 }] },
                          { "prim": "GET", "args": [{ "int": 17 }] },
                          { "prim": "DUP", "args": [{ "int": 6 }] },
                          { "prim": "GET", "args": [{ "int": 13 }] },
                          { "prim": "PAIR" },
                          { "prim": "PAIR" },
                          { "prim": "CONS" },
                          { "prim": "SELF_ADDRESS" },
                          { "prim": "PAIR" },
                          { "prim": "NIL", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "list", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "pair", "args": [{ "prim": "nat" }, { "int": 0 }] }] }] }] }] },
                          { "prim": "SWAP" },
                          { "prim": "CONS" },
                          { "prim": "TRANSFER_TOKENS" },
                          { "prim": "CONS" },
                          { "prim": "SWAP" },
                          { "prim": "DUP" },
                          { "prim": "GET", "args": [{ "int": 18 }] },
                          { "prim": "PUSH", "args": [{ "prim": "nat" }, { "int": 1 }] },
                          { "prim": "ADD" },
                          { "prim": "UPDATE", "args": [{ "int": 18 }] },
                          { "prim": "SWAP" }
                        ],
                        [
                          { "prim": "SWAP" },
                          { "prim": "DUP" },
                          { "prim": "GET", "args": [{ "int": 3 }] },
                          { "prim": "SENDER" },
                          { "prim": "COMPARE" },
                          { "prim": "EQ" },
                          { "prim": "IF", "args": [[], [{ "prim": "PUSH", "args": [{ "prim": "string" }, { "string": "NOT_ADMIN" }] }, { "prim": "FAILWITH" }]] },
                          { "prim": "UPDATE", "args": [{ "int": 1 }] },
                          { "prim": "NIL", "args": [{ "prim": "operation" }] }
                        ]
                      ]
                    }
                  ],
                  [
                    {
                      "prim": "IF_LEFT",
                      "args": [
                        [
                          { "prim": "SWAP" },
                          { "prim": "DUP" },
                          { "prim": "GET", "args": [{ "int": 3 }] },
                          { "prim": "SENDER" },
                          { "prim": "COMPARE" },
                          { "prim": "EQ" },
                          { "prim": "IF", "args": [[], [{ "prim": "PUSH", "args": [{ "prim": "string" }, { "string": "NOT_ADMIN" }] }, { "prim": "FAILWITH" }]] },
                          { "prim": "UPDATE", "args": [{ "int": 5 }] },
                          { "prim": "NIL", "args": [{ "prim": "operation" }] }
                        ],
                        [
                          { "prim": "SWAP" },
                          { "prim": "DUP" },
                          { "prim": "GET", "args": [{ "int": 3 }] },
                          { "prim": "SENDER" },
                          { "prim": "COMPARE" },
                          { "prim": "EQ" },
                          { "prim": "IF", "args": [[], [{ "prim": "PUSH", "args": [{ "prim": "string" }, { "string": "NOT_ADMIN" }] }, { "prim": "FAILWITH" }]] },
                          { "prim": "DUP", "args": [{ "int": 2 }] },
                          { "prim": "GET", "args": [{ "int": 3 }] },
                          { "prim": "UPDATE", "args": [{ "int": 7 }] },
                          { "prim": "DUP", "args": [{ "int": 2 }] },
                          { "prim": "GET", "args": [{ "int": 5 }] },
                          { "prim": "UPDATE", "args": [{ "int": 9 }] },
                          { "prim": "DUP", "args": [{ "int": 2 }] },
                          { "prim": "GET", "args": [{ "int": 1 }] },
                          { "prim": "UPDATE", "args": [{ "int": 5 }] },
                          { "prim": "SWAP" },
                          { "prim": "DROP" },
                          { "prim": "NIL", "args": [{ "prim": "operation" }] }
                        ]
                      ]
                    }
                  ]
                ]
              }
            ],
            [
              {
                "prim": "IF_LEFT",
                "args": [
                  [
                    {
                      "prim": "IF_LEFT",
                      "args": [
                        [
                          { "prim": "SWAP" },
                          { "prim": "DUP" },
                          { "prim": "GET", "args": [{ "int": 3 }] },
                          { "prim": "SENDER" },
                          { "prim": "COMPARE" },
                          { "prim": "EQ" },
                          { "prim": "IF", "args": [[], [{ "prim": "PUSH", "args": [{ "prim": "string" }, { "string": "NOT_ADMIN" }] }, { "prim": "FAILWITH" }]] },
                          { "prim": "UPDATE", "args": [{ "int": 11 }] },
                          { "prim": "NIL", "args": [{ "prim": "operation" }] }
                        ],
                        [
                          { "prim": "SWAP" },
                          { "prim": "DUP" },
                          { "prim": "GET", "args": [{ "int": 3 }] },
                          { "prim": "SENDER" },
                          { "prim": "COMPARE" },
                          { "prim": "EQ" },
                          { "prim": "IF", "args": [[], [{ "prim": "PUSH", "args": [{ "prim": "string" }, { "string": "NOT_ADMIN" }] }, { "prim": "FAILWITH" }]] },
                          { "prim": "UPDATE", "args": [{ "int": 13 }] },
                          { "prim": "NIL", "args": [{ "prim": "operation" }] }
                        ]
                      ]
                    }
                  ],
                  [
                    {
                      "prim": "IF_LEFT",
                      "args": [
                        [
                          { "prim": "SWAP" },
                          { "prim": "DUP" },
                          { "prim": "GET", "args": [{ "int": 3 }] },
                          { "prim": "SENDER" },
                          { "prim": "COMPARE" },
                          { "prim": "EQ" },
                          { "prim": "IF", "args": [[], [{ "prim": "PUSH", "args": [{ "prim": "string" }, { "string": "NOT_ADMIN" }] }, { "prim": "FAILWITH" }]] },
                          { "prim": "DUP", "args": [{ "int": 2 }] },
                          { "prim": "GET", "args": [{ "int": 3 }] },
                          { "prim": "UPDATE", "args": [{ "int": 15 }] },
                          { "prim": "DUP", "args": [{ "int": 2 }] },
                          { "prim": "GET", "args": [{ "int": 5 }] },
                          { "prim": "UPDATE", "args": [{ "int": 17 }] },
                          { "prim": "DUP", "args": [{ "int": 2 }] },
                          { "prim": "GET", "args": [{ "int": 1 }] },
                          { "prim": "UPDATE", "args": [{ "int": 13 }] },
                          { "prim": "SWAP" },
                          { "prim": "DROP" },
                          { "prim": "NIL", "args": [{ "prim": "operation" }] }
                        ],
                        [
                          {
                            "prim": "IF_LEFT",
                            "args": [
                              [
                                { "prim": "SWAP" },
                                { "prim": "DUP" },
                                { "prim": "GET", "args": [{ "int": 3 }] },
                                { "prim": "SENDER" },
                                { "prim": "COMPARE" },
                                { "prim": "EQ" },
                                { "prim": "IF", "args": [[], [{ "prim": "PUSH", "args": [{ "prim": "string" }, { "string": "NOT_ADMIN" }] }, { "prim": "FAILWITH" }]] },
                                { "prim": "UPDATE", "args": [{ "int": 3 }] },
                                { "prim": "NIL", "args": [{ "prim": "operation" }] }
                              ],
                              [
                                { "prim": "SWAP" },
                                { "prim": "DUP" },
                                { "prim": "GET", "args": [{ "int": 3 }] },
                                { "prim": "SENDER" },
                                { "prim": "COMPARE" },
                                { "prim": "EQ" },
                                { "prim": "IF", "args": [[], [{ "prim": "PUSH", "args": [{ "prim": "string" }, { "string": "NOT_ADMIN" }] }, { "prim": "FAILWITH" }]] },
                                { "prim": "NIL", "args": [{ "prim": "operation" }] },
                                { "prim": "DUP", "args": [{ "int": 3 }] },
                                { "prim": "GET", "args": [{ "int": 15 }] },
                                { "prim": "CONTRACT", "args": [{ "prim": "list", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "list", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "pair", "args": [{ "prim": "nat" }, { "int": 0 }] }] }] }] }] }] },
                                { "prim": "IF_NONE", "args": [[{ "prim": "PUSH", "args": [{ "prim": "string" }, { "string": "REWARD_TOKEN_INVALID" }] }, { "prim": "FAILWITH" }], []] },
                                { "prim": "PUSH", "args": [{ "prim": "mutez" }, { "int": 0 }] },
                                { "prim": "NIL", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "pair", "args": [{ "prim": "nat" }, { "int": 0 }] }] }] },
                                { "prim": "DUP", "args": [{ "int": 6 }] },
                                { "prim": "GET", "args": [{ "int": 3 }] },
                                { "prim": "DUP", "args": [{ "int": 6 }] },
                                { "prim": "GET", "args": [{ "int": 17 }] },
                                { "prim": "DUP", "args": [{ "int": 7 }] },
                                { "prim": "PAIR" },
                                { "prim": "PAIR" },
                                { "prim": "CONS" },
                                { "prim": "SELF_ADDRESS" },
                                { "prim": "PAIR" },
                                { "prim": "NIL", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "list", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "pair", "args": [{ "prim": "nat" }, { "int": 0 }] }] }] }] }] },
                                { "prim": "SWAP" },
                                { "prim": "CONS" },
                                { "prim": "TRANSFER_TOKENS" },
                                { "prim": "CONS" },
                                { "prim": "SWAP" }
                              ]
                            ]
                          }
                        ]
                      ]
                    }
                  ]
                ]
              }
            ]
          ]
        },
        { "prim": "PAIR" }
      ]
    ]
  }
]
