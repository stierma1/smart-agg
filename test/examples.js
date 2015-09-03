
module.exports = {
  "test1": function(When, Context){
    When(
      Context("powerLevel(Owner, Target, State)", "Vegeta", "Goku", "9000").is.provided.by("scouter"),
      Context("bloodPressure(Person, State)", "mark", "is_high").is.provided.by("watch")
    )
    .set(
      Context("status(Person, State, Message)", "Napa", "alarmed", "WHAT 9000!?!").on("picture")
    );
  },
  "test2": function(When, Context){
    When(
      Context("jobs(Status)", "empty").is.provided.by("job_manager"),
      Context("is_brainwashed(Person)", "mark").is.provided.by("watch")
    )
    .set(
      Context("behavior(Type)", "wander").on("hello")
    )
  },
  "single-provider-case": function(When, Context){
    When(
      Context("jobs(Status)", "empty").is.provided.by("provider1")
    )
    .set(
      Context("behavior(Type)", "stuff").on("provider1")
    )
  },
  "two-provider-case": function(When, Context){
    When(
      Context("jobs(Status)", "filled").is.provided.by("job_queue"),
      Context("work(Status)", "none").is.provided.by("worker")
    )
    .set(
      Context("request(JQ)", "job_queue").on("worker")
    )
  },
  "two-provider-case-two-emitter": function(When, Context){
    When(
      Context("likes(Person)", "bob").is.provided.by("jane"),
      Context("likes(Person)", "jane").is.provided.by("bob")
    )
    .set(
      Context("sendEmail(ToAddress)", "bob").on("jane"),
      Context("sendEmail(ToAddress)", "jane").on("bob")
    )
  },
  "set_behavior": function(When, Context){
    When(
      Context("job_queue(State)", "empty").is.provided.by("job_manager"),
      Context("powerLevel(State)", "1").is.probv
    )
  }
}
